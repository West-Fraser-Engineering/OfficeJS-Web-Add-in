

const login_url = "https://app.bchydro.com/mvwebbe/user/login";
let jwtToken: string | null = null;

interface EMeterResponseBody {
    dnlDataParentList: string[][]
}



export async function signIn(username: string, password: string) {
    try {
        username = username.replaceAll("\"", "\"\"");
        password = password.replaceAll("\"", "\"\"");
        const request_body = JSON.stringify({ username, password });

        const response = await fetch('http://localhost:38820/' + login_url, {
            method: 'POST',
            body: request_body,
            headers: { 'Content-Type': 'application/json' },
        });
        const response_body = await response.json();

        jwtToken = response_body.jwtToken;

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function daysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate()
}

type CacheKey = `${string}:${number}:${number}`;
const cache: Map<CacheKey, string[][]> = new Map();

export async function downloadEMeterData(username: string, password: string, meter_id: string, start_date: Date, end_date: Date, type: "usage" | "demand") {
    const key: CacheKey = `${meter_id}:${start_date.getTime()}:${end_date.getTime()}`;
    const cached_value = cache.get(key);
    if (cached_value) {
        return cached_value;
    }

    const timestamp_ms = new Date().getTime();
    const intervalLength = 60; // minutes.  Removed from params and hardcoded to 60 minutes to save space in caching.
    const startDate = `${start_date.getUTCMonth() + 1}/${start_date.getUTCDate()}/${start_date.getUTCFullYear()}`;
    const endDate = `${end_date.getUTCMonth() + 1}/${end_date.getUTCDate()}/${end_date.getUTCFullYear()}`;
    const url = `https://app.bchydro.com/mvwebbe/rest/meterdownload?tsp=${timestamp_ms}&meterId=${meter_id}&intLength=${intervalLength}&selectedChannelNum=1&selectedSetNum=1&calendarMonth=0&reportStart=${startDate}&reportEnd=${endDate}&usageOrDemand=${type}&idOrGroup=meter`;

    let triedSigningIn = false;
    if (!jwtToken) {
        const success = await signIn(username, password);
        if (!success) {
            throw new Error("Could not sign in to eMeter.");
        }
        triedSigningIn = true;
    }

    while (true) {
        console.log('Sending request to ' + url);
        const response = await fetch('http://localhost:38820/' + url, {
            headers: {
                'Authorization': `Bearer ${jwtToken ?? ""}`
            }
        });

        console.log('Status', response.status)

        if (response.ok) {
            console.log('Fetching response body')
            const response_body = await response.json() as EMeterResponseBody;
            console.log(response_body);
            const data = parseDataResponse(response_body);
            cache.set(key, data);
            return data;
        } else if (!triedSigningIn && (response.status === 500 || response.status === 401)) {
            const success = await signIn(username, password);
            if (!success) {
                throw new Error("Could not sign in to eMeter.");
            }
            triedSigningIn = true;
        } else {
            console.log('Error', response.status)
            throw new Error(`Error: ${response.status}`);
        }


        // using var response = await httpClient.GetAsync(url);
        // if (response.IsSuccessStatusCode) {
        //     var content = await response.Content.ReadAsStringAsync();
        //     return content;
        // }
        // else if (!triedSigningIn && (response.StatusCode == HttpStatusCode.InternalServerError || response.StatusCode == HttpStatusCode.Unauthorized)) {
        //     bool success = SignIn(username, password);
        //     if (!success) {
        //         throw new Exception("Could not sign in to eMeter.");
        //     }
        //     triedSigningIn = true;
        // }
        // else {
        //     throw new Exception($"Error: {response.StatusCode}");
        // }
    }
}

function parseDataResponse(data: EMeterResponseBody): string[][] {
    const rootElement = data.dnlDataParentList[0];

    let csvRaw: string = '';
    let rowNumber = 0;

    for (const row of rootElement) {
        if (rowNumber === 0) {
            rowNumber++;
            continue; // Skip the weird first meter ID
        }

        for (const col of row) {
            let col_str: string | undefined;

            if ((col_str = col) !== undefined) {
                if (rowNumber === 2) {
                    csvRaw += '\n';
                }
                csvRaw += col_str;
            } else {
                throw new Error(`Error parsing row ${rowNumber}`);
            }
        }

        rowNumber++;
    }

    // Split CSV raw data into rows
    const rows = csvRaw.split('\n');

    // Split each row into columns
    const csvFields: string[][] = rows.map(row => row.split(','));

    return csvFields;
}