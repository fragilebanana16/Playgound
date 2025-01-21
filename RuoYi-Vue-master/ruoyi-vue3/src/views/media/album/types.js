/**
 * @typedef {Object} IFileInfo
 * @property {number} fileid
 * @property {string} filename
 * @property {string} etag
 */

/**
 * @typedef {Object} IDay
 * @property {number} dayid
 * @property {number} count // Number of photos in this day
 * @property {Set<IRow>} rows // Set of rows in the day
 * @property {IPhoto[]} detail // Number of photos in this day
 * @property {IFileInfo[]} fileInfos // WebDAV fileInfos, fetched before viewer open
 * @property {Set<number>} origFileIds //Original fileIds from fileInfos
 * 
 */

/**
 * @typedef {Object} IPhoto
 * @property {number} fileid - Nextcloud ID of the file.
 * @property {string} [etag] - Etag from server.
 * @property {number} flag - Bit flags.
 * @property {IDay} [d] - Reference to the day object.
 * @property {boolean} [isvideo] - Video flag from server.
 * @property {boolean} [isfavorite] - Favorite flag from server.
 */

/**
 * @typedef {Object} IRow
 * @property {number} [id] - Vue Recycler identifier.
 * @property {number} dayId - Day ID.
 * @property {IDay} day - Reference to the day object.
 * @property {boolean} [head] - Whether this is a head row.
 * @property {string} [name] - [Head only] Title of the header.
 * @property {IPhoto[]} [photos] - Main list of photo items.
 * @property {number} [size] - Height in px of the row.
 * @property {number} [pct] - Count of placeholders to create.
 */

/**
 * @typedef {Object} ITick
 * @property {number} dayId - Day ID.
 * @property {number} top - Top row at this.
 * @property {number} topS - Static distance from top (for headers).
 * @property {number} topC - Count row distance from top (dynamic).
 * @property {string|number} [text] - Text if any (e.g. year).
 * @property {boolean} [s] - Whether this tick should be shown.
 */


