/**Converts an Excel date serial into a Date object.
 * 
 * @param {number} xlSerial - The Excel date serial number
 * @returns 
 */
function dateFromSerial(xlSerial) {
    // each serial up to 60 corresponds to a valid calendar date.
    // serial 60 is 1900-02-29. This date does not exist on the calendar.
    // we choose to interpret serial 60 (as well as 61) both as 1900-03-01
    // so, if the serial is 61 or over, we have to subtract 1.
    if (xlSerial < 61) {
        xlSerial = xlSerial;
    }
    else {
        xlSerial = xlSerial - 1;
    }

    let timestamp = (xlSerial - 25568) * 24 * 3600 * 1000;

    return new Date(timestamp);
}

/**Parses an Excel string date or date serial into a JavaScript Date object.
 * 
 * @param {number | string} xlDate 
 */
export function parseDate(xlDate) {
    switch (typeof xlDate) {
        case "string": {
            const date = new Date(xlDate);
            if (isNaN(date.getTime())){
                throw new Error(`Invalid date "${xlDate}".`);
            }
            return new Date(xlDate);
        }
        case "number":
            return dateFromSerial(xlDate);
    }
}

