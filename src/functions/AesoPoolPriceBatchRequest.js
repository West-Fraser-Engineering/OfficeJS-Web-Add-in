
/** @type {Map<Date, {resolve: (value: any) => void, reject: (value: any) => void}[]}>} */
let batch = new Map();
let is_batched_request_scheduled = false;

const BATCH_REQUEST_DELAY = 100; // milliseconds

/**
 * 
 * @param {Date} request_date - The day to make the request for
 * @returns 
 */
export function pushRequest(request_date) {
    const invocationEntry = {
        resolve: undefined,
        reject: undefined,
    };

    const promise = new Promise((resolve, reject) => {
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

    const requests = new Map();
    /** @type {Date | null} */
    let start_date = null;
    let invocation_entries = [];
    for (let i = 0; i < entries.length; i++) {
        const [date, invocationEntry] = entries[i];
        if (start_date == null) {
            start_date = date;
        }

        invocation_entries.push(invocationEntry);

        if (date - start_date > millisecondsInYear || i == entries.length - 1) {
            // Make a request
            let start_year = start_date.getUTCFullYear().toFixed();
            let start_month = (start_date.getUTCMonth() + 1).toFixed().padStart(2, "0");
            let start_day = (start_date.getUTCDate() + 1).toFixed().padStart(2, "0");
            let end_year = date.getUTCFullYear().toFixed();
            let end_month = (date.getUTCMonth() + 1).toFixed().padStart(2, "0");
            let end_day = (date.getUTCDate() + 1).toFixed().padStart(2, "0");
            const endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1.1/price/poolPrice?startDate=${start_year}-${start_month}-${start_day}&endDate=${end_year}-${end_month}-${end_day}`;

            requests.set(endpoint, invocation_entries);
            start_date = null;
            invocation_entries = [];
        }
    }

    const promises = [];
    for (const [endpoint, invocation_entries] of requests) {
        promises.push(new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(endpoint, {
                    headers: {
                        'X-API-Key': localStorage.getItem('aeso-api-key')
                    }
                }); const json = await response.json();
                for (const invocation_entry of invocation_entries) {
                    invocation_entry.resolve(json);
                }
            } catch (error) {
                for (const invocation_entry of invocation_entries) {
                    invocation_entry.reject(error);
                }
            }
            resolve();
        }));
    }

    await Promise.allSettled(promises);
}