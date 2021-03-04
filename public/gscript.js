/// This script intended to be used with Google Script. Look the usage instructions at
/// http://iot-proxy.com/howitworks.html
/// Script functions documentation -
/// http://iot-proxy.com/global.html
/// The code below is the library used to manage all requests of you program.
/// We are completely open, you may review that we do nothing except we announced.
/// The code below may be used witout any restrictions.
/// We will be thankful if you will refer the iot-proxy.com

let email = 'useremail';
let password = 'userpassword';
let region = 'userregion';
let devices = null;
const mySheet = SpreadsheetApp.getActiveSheet();

/**
 * Provide email, password and region to control the eWeLink devices through the script.
 *
 * @param {string} mail - email for the eWeLinkAccount
 * @param {string} pass - password for the eWeLinkAccount
 * @param {string} region - region, one of eu, us, cn
 * @param {sheet} sheet - the sheet to operate, usually it is SpreadsheetApp.getActiveSheet()
 *
 */
function setup(mail, pass, reg) {
  email = mail;
  password = pass;
  region = reg;
}

const APP_ID = 'YzfeftUVcZ6twZw1OoVKPRFYTrGEg01Q';
function baseUrl() {
  return `https://${region}-api.coolkit.cc:8080/api/user`;
}
let token = null;

function ewLogin() {
  if (!token) {
    if (email.length && password.length && region.length) {
      const data = JSON.stringify({ appid: APP_ID, email, password, ts: Math.floor(Date.now() / 1000), version: 8 });
      const encoded = Utilities.base64Encode(Utilities.computeHmacSha256Signature(data, '4G91qSoboqYO4Y0XJ0LPPKIsq8reHdfa'));
      const options = { headers: { Authorization: `Sign ${encoded}` }, method: 'post', contentType: 'application/json', payload: data };
      const answ = JSON.parse(UrlFetchApp.fetch(`${baseUrl()}/login`, options).getContentText());
      if (answ.hasOwnProperty('at')) {
        console.log('Login to eWeLink successful.');
        token = answ.at;
        return true;
      } else {
        console.error('Login to eWeLink failed.');
      }
    } else {
      console.error('Email, password, region not specified. Use setup(...) first.');
    }
    return false;
  }
  return true;
}

/**
   * Get full sate of the device as javascript object, use console.log to discover the object.
   *
   * @param {device} the device identifier, in ''
   */
function ewGetDevice(device) {
  if (ewLogin()) {
    const uri = `${baseUrl()}/device/${device}?deviceid=${device}&appid=${APP_ID}&version=8`;
    const object = JSON.parse(UrlFetchApp.fetch(uri, { headers: { Authorization: `Bearer ${token}` } }).getContentText());
    return object;
  } else return {};
}

/**
   * Get all devices list. Use console.log to discover the structure.
   */
function ewGetDevices() {
  if (devices) return devices;
  if (ewLogin()) {
    const uri = `${baseUrl()}/device?lang=en&appid=${APP_ID}&version=8&getTags=1`;
    devices = JSON.parse(UrlFetchApp.fetch(uri, { headers: { Authorization: `Bearer ${token}` } }).getContentText());
    if (devices && devices.hasOwnProperty('devicelist')) {
      console.log(`Got devices list successvully, ${devices.devicelist.length} devices found.`);
    } else {
      console.error('Unable to get devices list.');
      devices = null;
    }
    return devices;
  } else return {};
}

/**
   * Returns the device identifier by it' name. Returns '' if the device not found. This function triggers ewGetDevices(), it is slow, but if performed once, next calls of getDeviceID will be fast.
   *
   * @param {string} deviceName - the device name
   */
function getDeviceID(deviceName) {
  const dev = ewGetDevices();
  if (dev) {
    const device = dev.devicelist.find(el => el.name === deviceName);
    if (device) {
      console.log(`Found the device by name: ${deviceName} => ${device.deviceid}`);
      return device.deviceid;
    } else {
      console.error(`Device "${deviceName}" not found. This is the list of available devices:`);
      dev.devicelist.forEach(d => console.log(`${d.deviceid}: ${d.name}`));
    }
  }
  return '';
}

/**
   * Get the device state related to the given field.
   * @ignore
   * @param {string} device - the device identifier, in ''
   * @param {string} field - the value to get state, usually it are 'switch', 'currentTemperature', 'currentHumidity'.
   */
function ewGetDeviceState(device, field) {
  const res = ewGetDevice(device);
  let result = '';
  if (res.hasOwnProperty(field)) result = res[field];
  if (res.hasOwnProperty('params') && res.params.hasOwnProperty(field)) result = res.params[field];
  console.log(`Got device ${device} (${device.name}), state: ${result}`);
  return result;
}

/**
   * Set the device states. You may set multiple states at once.
   *
   * @param {string} device - the device identifier, in ''
   * @param {object} value - the object that containt the list of fields to change. Example: {switch: 'on', pulse: 'on', pulseWidth: 5000}.
   * Look the console.log(ewGetDevice(device).params) for the full set of possible values.
   */
function deviceSet(device, value) {
  if (ewLogin()) {
    const uri = `${baseUrl()}/device/status`;
    const data = `{"deviceid":"${device}","params":${JSON.stringify(value)},"appid":"${APP_ID}","version":8}`;
    const options = { headers: { Authorization: `Bearer ${token}` }, method: 'post', contentType: 'application/json', payload: data };
    const response = JSON.parse(UrlFetchApp.fetch(uri, options).getContentText());
    console.log(`Sent request to change state ${device}: ${JSON.stringify(value)}, got responce: ${JSON.stringify(response)}, ${response.error === 0 ? 'no errors' : 'error returned!'}`);
    return response.error === 0;
  }
  return false;
}

/**
   * Returns '' if value is incorrect or undefined.
   * @ignore
   * @param {string} str - the value to check
   */
function validate(str) {
  return str === 'undefined' || str.length > 40 ? '' : str;
}

/**
   * Get the device state related to the given field.
   *
   * @param {string} device - the device identifier, in ''
   * @param {string} field - the value to get state, usually it are 'switch', 'currentTemperature', 'currentHumidity'.
   */
function deviceGet(id, field) {
  return ewGetDeviceState(id, field);
}

/// simplest math

/**
   * Returns x^2
   * @ignore
   */
function sqr(x) {
  return x * x;
}

/**
   * Returns sqrt(x)
   * @ignore
   */
function sqrt(x) {
  return Math.sqrt(x, 0.5);
}

/**
   * Returns 0 if value is invalid or value itself
   * @ignore
   */
function valid(x) {
  return x < 10000000000 && x > -10000000000 ? x : 0;
}

/// Google Sheets cells access

/**
   * Returns the cell value for the current Google Sheet
   *
   * @param {number} r - the row
   * @param {number} c - the column
   */
function getCell(r, c) {
  return mySheet.getRange(r, c).getValue(); // Get the cell from the sheet
}

/**
   * Set the cell value
   *
   * @param {number} r - the row
   * @param {number} c - the column
   * @param {number} value - the value to write in the cell
   */
function setCell(r, c, value) {
  mySheet.getRange(r, c).setValue(value);// set the cell value
}

/**
   * Increment the cell on the given value
   *
   * @param {number} r - the row
   * @param {number} c - the column
   * @param {number} value - the increment value
   */
function incrementCell(r, c, value) {
  const newval = getCell(r, c) + value;
  setCell(r, c, newval); // add some value to the cell
  return newval;
}

/**
   * Delete the whole column
   *
   * @param {number} c - the column to delete
   */
function deleteColumn(c) {
  mySheet.deleteColumn(c);
}

/**
   * Delete the whole row
   *
   * @param {number} c - the row to delete
   */
function deleteRow(c) {
  mySheet.deleteRow(c);
}

/**
   * Clear cells in range
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function clearCells(r0, c0, r1, c1) {
  mySheet.getRange(r0, c0, r1, c1).clear();
}

/**
   * Operate over the cells in square region
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   * @param {string/number} init - the initial value
   * @param {function} func - the function to operate, example of usage:
   * const summCells = (r0, c0, r1, c1) => cellsOperate(r0, c0, r1, c1, 0, (summ, value) => summ + Number(value));
   */
function cellsOperate(r0, c0, r1, c1, init, func) {
  let initial = init;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) { initial = func(initial, getCell(r, c)); }
  }
  return valid(initial);
}

/**
   * Summ cells values in range (as numerical values)
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function summCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, 0, (summ, value) => summ + Number(value));
}

/**
   * Concatenate cells in range (as strings)
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function concatenateCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, '', (summ, value) => summ + value);
}

/**
   * Multiply cells values in range (as numerical values)
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function productCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, 1.0, (summ, value) => summ * Number(value));
}

/**
   * Find maximim value in cells (as numerical values)
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function maxInCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, -20000000000, (summ, value) => Math.max(summ, Number(value)));
}

/**
   * Find minimum value in cells (as numerical values)
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function minInCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, 20000000000, (summ, value) => Math.min(summ, Number(value)));
}

/**
   * Get amount of non-empty cells in range
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function countFilledCells(r0, c0, r1, c1) {
  return cellsOperate(r0, c0, r1, c1, 0.0, (summ, value) => (value === '' ? summ : summ + 1));
}

/**
   * Get average value of cells in range
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function averageInCells(r0, c0, r1, c1) {
  return summCells(r0, c0, r1, c1) / countFilledCells(r0, c0, r1, c1);
}

/**
   * Get standart deviation of the values in range
   *
   * @param {number} r0 - start row
   * @param {number} c0 - start column
   * @param {number} r1 - end row
   * @param {number} c1 - end column
   */
function deviationInCells(r0, c0, r1, c1) {
  const av = averageInCells(r0, c0, r1, c1);
  return valid(sqrt(cellsOperate(r0, c0, r1, c1, 0.0, (summ, value) => summ + sqr(Number(value) - av)) / countFilledCells(r0, c0, r1, c1)));
}

/// Date and time

/**
   * Get current date/time
   */
function now() {
  return new Date();
}

/**
   * Convert value to date format
   */
function toDate(x) {
  return new Date(x); // convert to date & time format
}

/**
 * Returns minutes since 0:00 today
 */

function thisDayTime() {
  const tm = new Date();
  return tm.getHours() * 60 + tm.getMinutes();
}

/**
 * Returns minutes since 0:00 for the given hour and minute
 *
 * @param {number} hour - the hour
 * @param {number} minute - the minute
 */

function dayTime(hour, minute) {
  return hour * 60 + minute;
}
/**
 * Returns day of the week, 0- Sunday, 1-Monday,...
 */

function thisWeekDay() {
  return (new Date()).getDay();
}

/**
 * Scans all unread mails for the last day
 *
 * @param {string} from - if not empty, only messages from this email will be taken into account.
 * @param {string} subject - if not empty, only messages with this substring will be taken.
 * @param {string} body - if not empty, only messages with the substring in the body will be taken.
 * @param {function} todo - the callback, will be called for each message as todo(message)
 */

function forAllRecentUnreadMails(from, subject, body, todo) {
  let query = 'is:unread newer_than:1d';
  if (from && from.length) query += ` from: ${from}`;
  if (subject && subject.length) query += ` from: ${subject}`;
  if (body && body.length) query += ` "${body}"`;
  const threads = GmailApp.search(query);
  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    for (let j = 0; j < messages.length; j++) {
      const message = messages[j];
      todo(message);
    }
  }
}