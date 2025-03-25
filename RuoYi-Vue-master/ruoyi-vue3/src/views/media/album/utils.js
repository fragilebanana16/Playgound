import { camelCase, isNumberStr } from '@/utils'
import { c } from "./constants";

/** Get JS date object from dayId */
export function dayIdToDate(dayId){
    return new Date(Number(dayId)*86400*1000);
}
/** Get month name from number */
export function getShortDateStr(date) {
    return date.toLocaleDateString("en-US", {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    });
}
/** Get long date string with optional year if same as current */
export function getLongDateStr(date, skipYear=false) {
    return date.toLocaleDateString("en-US", {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: (skipYear && date.getUTCFullYear() === new Date().getUTCFullYear()) ? undefined : 'numeric',
        timeZone: 'UTC',
    });
}

export function genFileInfo(obj) {
    const fileInfo = {}

    Object.keys(obj).forEach(key => {
        const data = obj[key]

        // flatten object if any
        if (!!data && typeof data === 'object') {
            Object.assign(fileInfo, genFileInfo(data))
        } else {
            // format key and add it to the fileInfo
            if (data === 'false') {
                fileInfo[camelCase(key)] = false
            } else if (data === 'true') {
                fileInfo[camelCase(key)] = true
            } else {
                fileInfo[camelCase(key)] = isNumberStr(data)
                    ? Number(data)
                    : data
            }
        }
    })
    return fileInfo
}

/**
  * Round a number to N decimal places
  * @param num Number to round
  * @param places Number of decimal places
  * @param floor If true, round down instead of to nearest
  */
 export function round(num, places, floor=false) {
    const pow = Math.pow(10, places);
    const int = num * pow;
    return (floor ? Math.floor : Math.round)(int) / pow;
}

/**
 * Round to nearest 0.5. Useful for pixels. .5的倍数
 * @param num Number to round
 */
export function roundHalf(num) {
    return Math.round(num * 2) / 2;
}

export function binarySearch(arr, elem, key) {
    let minIndex = 0;
    let maxIndex = arr.length - 1;
    let currentIndex;
    let currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = key ? arr[currentIndex][key] : arr[currentIndex];

        if (currentElement < elem) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > elem) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }

    return minIndex;
}

/**
  * Convert server-side flags to bitmask
  * @param {IPhoto} photo Photo to process
  */
 export function convertFlags(photo) {
    if (photo.isvideo) {
        photo.flag |= c.FLAG_IS_VIDEO;
        delete photo.isvideo;
    }
    if (photo.isfavorite) {
        photo.flag |= c.FLAG_IS_FAVORITE;
        delete photo.isfavorite;
    }
    if (photo.isfolder) {
        photo.flag |= c.FLAG_IS_FOLDER;
        delete photo.isfolder;
    }
}