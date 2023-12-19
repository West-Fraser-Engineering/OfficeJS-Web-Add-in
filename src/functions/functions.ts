import { getMeteredVolume } from "./AesoMeteredVolumeBatchRequest";
import { pushRequest } from "./AesoPoolPriceBatchRequest";
import { downloadEMeterData, signIn } from "./BcHydroEMeter";
import { parseDate } from "./xlDate";

/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number | string} date 
 * @param {number} hour 
 * @returns {Promise<number>}
 */
async function AesoPoolPrice(date: number | string, hour: number): Promise<number> {
    try {
        let js_date = parseDate(date);
        const json = await pushRequest(js_date);

        const begin_datetime_mpt = `${js_date.getUTCFullYear()
            }-${(js_date.getUTCMonth() + 1).toString().padStart(2, '0')
            }-${js_date.getUTCDate().toString().padStart(2, '0')
            } ${(hour - 1).toString().padStart(2, '0')
            }:00`
        for (const item of json.return["Pool Price Report"]) {
            if (item.begin_datetime_mpt == begin_datetime_mpt) {
                return parseFloat(item.pool_price);
            }
        }

        throw new Error("Not found.")
    } catch (err) {
        console.error(err);
        throw err;
    }

    // return json;
}

/**
 * 
 * @customfunction AesoMeteredVolume
 * @param {number | string} date 
 * @param {number} hour 
 * @returns {Promise<number>}
 */
async function AesoMeteredVolume(asset_id: string, date: number | string, hour: number): Promise<number> {
    try {
        let js_date = parseDate(date);
        const volume = await getMeteredVolume(asset_id, new Date(js_date.getTime() + (hour - 1) * 3600_000));
        return volume;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

/**
 * Take a number as the input value and return a formatted number value as the output.
 * @customfunction
 * @param {number} value
 * @param {string} format (e.g. "0.00%")
 * @returns A formatted number value.
 */
function DEBUG_createFormattedNumber(value: number, format: string) {
    return {
        type: "FormattedNumber",
        basicValue: value,
        numberFormat: format
    }
}


/**
 * Logs its input to the dev console.
 * @customfunction
 * @param {any} value
 * @returns
 */
function DEBUG_LogInput(value: any) {
    console.log(typeof value + ":", value);
}


/**
 * Opens a window at the location.
 * @customfunction
 * @returns
 */
function DEBUG_ShowWindow(url: string) {
    Office.context.ui.displayDialogAsync(url, { promptBeforeOpen: false, displayInIframe: false });
}

/**
 * Signs into BC Hydro eMeter.
 * @customfunction
 * @returns
 */
function DEBUG_BcHydroSignIn(username: string, password: string) {
    return signIn(username, password);
}

/**
 * Downloads eMeter usage data for a specified meter within a date range.
 * @param username - The eMeter account username.
 * @param password - The eMeter account password.
 * @param meterId - The unique identifier of the meter for which data is requested.
 * @param startDate - The start date of the data range (inclusive).
 * @param endDate - The end date of the data range (inclusive).
 * @returns - A promise that resolves with the downloaded eMeter usage data.
 * @customfunction
 */
async function BcHydroEMeterUsage(username: string, password: string, meter_id: string, start_date: number | string, end_date: number | string): Promise<string[][]> {
    try {
        let js_start_date = parseDate(start_date);
        let js_end_date = parseDate(end_date);

        return downloadEMeterData(username, password, meter_id, js_start_date, js_end_date, "usage");
    } catch(err: any) {
        console.error(err);
        throw err;
    }
}

/**
 * Downloads eMeter demand data for a specified meter within a date range.
 * @param username - The eMeter account username.
 * @param password - The eMeter account password.
 * @param meterId - The unique identifier of the meter for which data is requested.
 * @param startDate - The start date of the data range (inclusive).
 * @param endDate - The end date of the data range (inclusive).
 * @returns - A promise that resolves with the downloaded eMeter demand data.
 * @customfunction
 */
async function BcHydroEMeterDemand(username: string, password: string, meter_id: string, start_date: number | string, end_date: number | string): Promise<string[][]> {
    try {
        let js_start_date = parseDate(start_date);
        let js_end_date = parseDate(end_date);

        return downloadEMeterData(username, password, meter_id, js_start_date, js_end_date, "demand");
    } catch(err: any) {
        console.error(err);
        throw err;
    }
}


declare var CustomFunctions: any;