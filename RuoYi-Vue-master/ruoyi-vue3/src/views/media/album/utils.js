import { camelCase, isNumberStr } from '@/utils'
/** Get JS date object from dayId */
export function dayIdToDate(dayId){
    return new Date(Number(dayId)*86400*1000);
}
/** Get month name from number */
export function getMonthName(date) {
    const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        timeZone: 'UTC',
    });
    return dateTimeFormat.formatToParts(date)[0].value;
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