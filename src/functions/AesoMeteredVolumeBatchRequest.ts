
export interface AesoMeteredVolumeResponseBody {
    timestamp: string,
    responseCode: string,
    return: {
        pool_participant_ID: string,
        asset_list: {
            asset_id: string,
            asset_class: string,
            metered_volume_list: {
                begin_date_utc: DateTimeString,
                begin_date_mpt: DateTimeString,
                metered_volume: string
            }[]
        }[]
    }[]
}

type DateTimeString = `${string}-${string}-${string} ${string}:${string}`;

const cache: Map<string /*Asset ID*/, Map<DateTimeString /*Time*/, number /*Volume MWh*/>> = new Map();

const BATCH_REQUEST_DELAY = 100; // milliseconds
let batch: { asset_id: string, dateTime: Date, resolve: () => void, reject: (err: any) => void }[] = [];
let is_batched_request_scheduled = false;

export async function getMeteredVolume(asset_id: string, dateTime: Date): Promise<number> {
    const date_time_string: DateTimeString = `${dateTime.getUTCFullYear().toFixed()
        }-${(dateTime.getUTCMonth() + 1).toFixed().padStart(2, '0')
        }-${(dateTime.getUTCDate() + 1).toFixed().padStart(2, '0')
        } ${dateTime.getUTCHours().toFixed().padStart(2, '0')
        }:00`;

    for (let i = 0; i < 2; i++) {
        const cached_asset = cache.get(asset_id);
        const cached_volume = cached_asset?.get(date_time_string);
        if (cached_volume == undefined) {
            if (i == 0) {
                await pushRequest(asset_id, dateTime);
            } else {
                throw new Error(`Could not get metered volume at ${date_time_string} for asset ${asset_id}.`);
            }
        }
        else {
            return cached_volume;
        }
    }
    throw new Error(`Could not get metered volume at ${date_time_string} for asset ${asset_id}.`);
}

function pushRequest(asset_id: string, dateTime: Date): Promise<void> {
    const promise = new Promise<void>((resolve, reject) => {
        batch.push({
            asset_id,
            dateTime,
            resolve,
            reject
        });
    });

    if (!is_batched_request_scheduled) {
        is_batched_request_scheduled = true;
        setTimeout(makeRequest, BATCH_REQUEST_DELAY);
    }

    return promise;
}

async function makeRequest() {
    console.log("Make request called");

    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const maxGapInDays = 5;
    const aesoApiKey = localStorage.getItem('aeso-api-key') ?? "";

    const copied_batch = batch;
    batch = [];
    is_batched_request_scheduled = false;

    const organized_batch: Map<string /*AssetId*/, Map<number /*Timestamp*/, { resolve: () => void, reject: (err: any) => void }[]>> = new Map();

    for (const item of copied_batch) {
        let asset_batch = organized_batch.get(item.asset_id);
        if (asset_batch == undefined) {
            asset_batch = new Map();
            organized_batch.set(item.asset_id, asset_batch);
        }

        let entry = asset_batch.get(item.dateTime.getTime());
        if (entry == undefined) {
            entry = [];
            asset_batch.set(item.dateTime.getTime(), entry);
        }

        entry.push({
            resolve: item.resolve,
            reject: item.reject
        });
    }

    const endpoints: string[] = [];
    const request_promises: Promise<void>[] = [];

    for (const [asset_id, asset_batch] of organized_batch.entries()) {
        const sorted_asset_batch_entries = Array.from(asset_batch.entries()).sort((a, b) => a[0] - b[0]);
        let earliest_timestamp: number | null = null;
        let last_timestamp: number | null = null;
        let callbacks: {
            resolve: () => void;
            reject: (err: any) => void;
        }[] = [];

        for (let i = 0; i < sorted_asset_batch_entries.length; i++) {
            const timestamp = sorted_asset_batch_entries[i][0];
            callbacks.concat(sorted_asset_batch_entries[i][1]);
            console.log('callbacks:', callbacks);
            

            if (earliest_timestamp == null) {
                earliest_timestamp = timestamp;
            }
            if (last_timestamp == null) {
                last_timestamp = timestamp;
            }

            const number_of_records = (Math.floor((timestamp - earliest_timestamp) / millisecondsInDay) + 1) * 24;
            if (number_of_records > 80_000
                || Math.floor((timestamp - last_timestamp) / millisecondsInDay) > maxGapInDays
                || i == sorted_asset_batch_entries.length - 1
            ) {
                const start_date = new Date(earliest_timestamp);
                const end_date = new Date(timestamp);
                const start_year = start_date.getUTCFullYear().toFixed();
                const start_month = (start_date.getUTCMonth() + 1).toFixed().padStart(2, '0');
                const start_day_of_month = (start_date.getUTCDate() + 1).toFixed().padStart(2, '0');
                const end_year = end_date.getUTCFullYear().toFixed();
                const end_month = (end_date.getUTCMonth() + 1).toFixed().padStart(2, '0');
                const end_day_of_month = (end_date.getUTCDate() + 1).toFixed().padStart(2, '0');

                let endpoint: string;
                if (start_year == end_year && start_month == end_month && start_day_of_month == end_day_of_month) {
                    endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1/meteredvolume/details?startDate=${start_year}-${start_month}-${start_day_of_month}&asset_ID=${asset_id}`;
                } else {
                    endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1/meteredvolume/details?startDate=${start_year}-${start_month}-${start_day_of_month}&endDate=${end_year}-${end_month}-${end_day_of_month}&asset_ID=${asset_id}`;
                }

                const this_request_callbacks = callbacks;
                callbacks = [];
                request_promises.push(new Promise<void>(async (resolve, reject) => {
                    try {
                        console.log('Request to', endpoint);
                        const response = await fetch(endpoint, {
                            headers: {
                                'X-API-Key': aesoApiKey
                            }
                        });

                        const json = await response.json() as AesoMeteredVolumeResponseBody;

                        for (const pool_participant of json.return) {
                            for (const asset of pool_participant.asset_list) {
                                let cached_asset = cache.get(asset.asset_id);
                                if (cached_asset == undefined) {
                                    cached_asset = new Map();
                                    cache.set(asset.asset_id, cached_asset);
                                }

                                for (const metered_volume of asset.metered_volume_list) {
                                    cached_asset.set(metered_volume.begin_date_mpt, parseFloat(metered_volume.metered_volume));
                                }
                            }
                        }

                        console.log('resolving callbacks', this_request_callbacks)
                        for (const callback of this_request_callbacks) {
                            callback.resolve();
                        }
 
                        resolve();
                    } catch (err) {
                        for (const callback of this_request_callbacks) {
                            callback.reject(err);
                        }
                        reject(err);
                    }
                }));

                endpoints.push(endpoint);
                earliest_timestamp = null;
                last_timestamp = null;
            }

            last_timestamp = timestamp;
        }
    }

    await Promise.allSettled(request_promises);
}