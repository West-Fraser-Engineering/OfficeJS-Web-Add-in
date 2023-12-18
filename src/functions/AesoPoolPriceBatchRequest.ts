export interface AesoPoolPriceResponseBody {
    timestamp: string,
    responseCode: string,
    return: {
        "Pool Price Report":  {
            begin_datetime_utc: string,
            begin_datetime_mpt: string,
            pool_price: string,
            forecast_pool_price: string,
            rolling_30day_avg: string,
        }[]
    }
}

interface InvocationEntry {
    resolve: ((value: AesoPoolPriceResponseBody) => void) | null,
    reject: ((value: any) => void) | null,
}

let batch: Map<Date, InvocationEntry[]> = new Map();
let is_batched_request_scheduled = false;

const BATCH_REQUEST_DELAY = 100; // milliseconds

/**
 * 
 * @param {Date} request_date - The day to make the request for
 * @returns 
 */
export function pushRequest(request_date: Date) {
    const invocationEntry: InvocationEntry = {
        resolve: null,
        reject: null,
    };

    const promise = new Promise<AesoPoolPriceResponseBody>((resolve, reject) => {
        invocationEntry.resolve = resolve;
        invocationEntry.reject = reject;
    });

    const existing_request = batch.get(request_date);
    if (existing_request) {
        existing_request.push(invocationEntry);
    } else {
        batch.set(request_date, [invocationEntry]);
    }

    if (!is_batched_request_scheduled) {
        is_batched_request_scheduled = true;
        setTimeout(makeRequest, BATCH_REQUEST_DELAY);
    }

    return promise;
}


async function makeRequest() {
    const millisecondsInYear = 365 * 24 * 60 * 60 * 1000;

    is_batched_request_scheduled = false;
    const copied_batch = new Map(batch);
    batch.clear();

    const entries = Array.from(copied_batch.entries()).sort((a, b) => a[0].getTime() - b[0].getTime());

    const requests: Map<string, InvocationEntry[]> = new Map();
    let start_date: Date | null = null;
    let batched_invocation_entries: InvocationEntry[] = [];
    for (let i = 0; i < entries.length; i++) {
        const [date, invocation_entries] = entries[i];
        if (start_date == null) {
            start_date = date;
        }

        for (const invocation_entry of invocation_entries) {
            batched_invocation_entries.push(invocation_entry);
        }

        if (date.getTime() - start_date.getTime() > millisecondsInYear || i == entries.length - 1) {
            // Make a request
            let start_year = start_date.getUTCFullYear().toFixed();
            let start_month = (start_date.getUTCMonth() + 1).toFixed().padStart(2, "0");
            let start_day = (start_date.getUTCDate() + 1).toFixed().padStart(2, "0");
            let end_year = date.getUTCFullYear().toFixed();
            let end_month = (date.getUTCMonth() + 1).toFixed().padStart(2, "0");
            let end_day = (date.getUTCDate() + 1).toFixed().padStart(2, "0");
            const endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1.1/price/poolPrice?startDate=${start_year}-${start_month}-${start_day}&endDate=${end_year}-${end_month}-${end_day}`;

            requests.set(endpoint, batched_invocation_entries);
            start_date = null;
            batched_invocation_entries = [];
        }
    }

    const promises: Promise<void>[] = [];
    for (const [endpoint, invocation_entries] of requests) {
        promises.push(new Promise<void>(async (resolve, reject) => {
            try {
                console.log('Web request to ', endpoint);
                const response = await fetch(endpoint, {
                    headers: {
                        'X-API-Key': localStorage.getItem('aeso-api-key') ?? ""
                    }
                });
                const json = await response.json() as AesoPoolPriceResponseBody;
                for (const invocation_entry of invocation_entries) {
                    if (invocation_entry.resolve)
                        invocation_entry.resolve(json);
                }
            } catch (error) {
                for (const invocation_entry of invocation_entries) {
                    if (invocation_entry.reject)
                        invocation_entry.reject(error);
                }
            }
            resolve();
        }));
    }

    await Promise.allSettled(promises);
}