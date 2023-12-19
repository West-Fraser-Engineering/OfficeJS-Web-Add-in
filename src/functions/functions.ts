import { getMeteredVolume } from "./AesoMeteredVolumeBatchRequest";
import { pushRequest } from "./AesoPoolPriceBatchRequest";
import { parseDate } from "./xlDate";

/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number | string} date 
 * @param {number} hour 
 * @returns {Promise<number>}
 */
async function AesoPoolPrice(date: number | string, hour: number): Promise<number> {
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
    let js_date = parseDate(date);
    const volume = await getMeteredVolume(asset_id, new Date(js_date.getTime() + (hour - 1) * 3600_000));
    return volume;
}

/**
 * Take a number as the input value and return a formatted number value as the output.
 * @customfunction
 * @param {number} value
 * @param {string} format (e.g. "0.00%")
 * @returns A formatted number value.
 */
function createFormattedNumber(value: number, format: string) {
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
function LogInput(value: any) {
    console.log(typeof value + ":", value);
}

declare var CustomFunctions: any;