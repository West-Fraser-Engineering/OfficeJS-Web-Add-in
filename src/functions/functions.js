
/**
 * 
 * @customfunction AesoPoolPrice
 * @param {number} date 
 * @param {number} hour 
 * @returns
 */
async function AesoPoolPrice(date, hour) {
    console.log(localStorage.getItem('aeso-api-key'));

    const js_date = dateFromSerial(date);
    let year = js_date.getFullYear().toFixed();
    let month = js_date.getMonth().toFixed();
    let day = js_date.getDate().toFixed();
    month = month.padStart(2-month.length, "0");
    day = month.padStart(2-day.length, "0");
    const endpoint = `https://api.aeso.ca/v1.1/price/poolPrice?startDate=${year}-${month}-${day}&endDate=${year}-${month}-${day}`;

    const response = await fetch(endpoint, {
        headers: {
            'X-API-Key': localStorage.getItem('aeso-api-key')   
        }
    });

    const json = await response.json();

    return JSON.stringify(json, null, 4);
}

CustomFunctions.associate("AesoPoolPrice", AesoPoolPrice);

/**Converts an Excel date serial into a Date object.
 * 
 * @param {number} serial - The Excel date serial number
 * @returns 
 */
function dateFromSerial(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    return new Date(utc_value * 1000);
}