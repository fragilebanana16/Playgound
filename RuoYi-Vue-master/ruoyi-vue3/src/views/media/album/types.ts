export type IFileInfo = {
    fileid: number;
    filename: string;
    etag: string;
    hasPreview: boolean;
    flag?: number;
}

export type IDay = {
    /** Day ID */
    dayid: number;
    /** Number of photos in this day */
    count: number;
    /** Rows in the day */
    rows?: IRow[];
    /** List of photos for this day */
    detail?: IPhoto[];
    /** WebDAV fileInfos, fetched before viewer open */
    fileInfos?: IFileInfo[];
    /** Original fileIds from fileInfos */
    origFileIds?: Set<number>;
}

export type IPhoto = {
    /** Nextcloud ID of file */
    fileid: number;
    /** Etag from server */
    etag?: string;
    /** Bit flags */
    flag: number;
    /** DayID from server */
    dayid?: number;
    /** Width of full image */
    w?: number;
    /** Height of full image */
    h?: number;
    /** Grid display width percentage */
    dispWp?: number;
    /** Grid display height (forced) */
    dispH?: number;
    /** Grid display X percentage */
    dispXp?: number;
    /** Grid display Y px */
    dispY?: number;
    /** Grid display row id (relative to head) */
    dispRowNum?: number;
    /** Reference to day object */
    d?: IDay;
    /** Video flag from server */
    isvideo?: boolean;
    /** Favorite flag from server */
    isfavorite?: boolean;
    /** Is this a folder */
    isfolder?: boolean;
    /** Optional datetaken epoch */
    datetaken?: number;
}

export interface IFolder extends IPhoto {
    /** Path to folder */
    path: string;
    /** FileInfos for preview images */
    previewFileInfos?: IFileInfo[];
    /** Name of folder */
    name: string;
}

export type IRow = {
    /** Vue Recycler identifier */
    id?: string;
    /** Row ID from head */
    num: number;
    /** Day ID */
    dayId: number;
    /** Refrence to day object */
    day: IDay;
    /** Whether this is a head row */
    type: IRowType;
    /** [Head only] Title of the header */
    name?: string;
    /** [Head only] Boolean if the entire day is selected */
    selected?: boolean;
    /** Main list of photo items */
    photos?: IPhoto[];
    /** Height in px of the row */
    size?: number;
    /** Count of placeholders to create */
    pct?: number;
}
export type IHeadRow = IRow & {
    type: IRowType.HEAD;
    selected: boolean;
    super?: string;
}
export enum IRowType {
    HEAD = 0,
    PHOTOS = 1,
    FOLDERS = 2,
}

export type ITick = {
    /** Day ID */
    dayId: number;
    /** Display top position */
    topF: number;
    /** Display top position (truncated to 1 decimal pt) */
    top: number;
     /** Y coordinate on recycler */
    y: number;
    /** Text if any (e.g. year) */
    text?: string | number;
    /** Whether this tick should be shown */
    s?: boolean;
}