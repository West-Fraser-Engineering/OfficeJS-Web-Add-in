import { parseDate } from "./xlDate";

/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number | string} date 
 * @param {number} hour 
 * @returns {Promise<number[][]}
 */
async function AesoPoolPrice(date, hour) {
    console.log(localStorage.getItem('aeso-api-key'));

    const js_date = parseDate(date);
    let year = js_date.getUTCFullYear().toFixed();
    let month = (js_date.getUTCMonth() + 1).toFixed();
    let day = (js_date.getUTCDate() + 1).toFixed();
    month = month.padStart(2, "0");
    day = month.padStart(2, "0");
    const endpoint = `http://localhost:38820/https://api.aeso.ca/report/v1.1/price/poolPrice?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}`;

    const response = await fetch(endpoint, {
        headers: {
            'X-API-Key': localStorage.getItem('aeso-api-key')
        }
    });

    const json = await response.json();

    console.log(json);

    const results = [];
    for (const item of json.return["Pool Price Report"]) {
        results.push([item.pool_price]);
    }

    return results;
}

/**Converts an Excel date to a JavaScript date.
 * 
 * @customfunction xlDateToJsDate
 * @param {number} xlSerial - The Excel date serial number
 */
function xlDateToJsDate(xlSerial) {
    return dateFromSerial(xlSerial).toString();
}

/**
 * Take a number as the input value and return a formatted number value as the output.
 * @customfunction
 * @param {number} value
 * @param {string} format (e.g. "0.00%")
 * @returns A formatted number value.
 */
function createFormattedNumber(value, format) {
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
function LogInput(value) {
    console.log(typeof value + ":",  value);
}
