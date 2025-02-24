export const TagDayID = {
    START:          -(1 << 30),
    FOLDERS:        -(1 << 30) + 1,
}
export const c = {
    FLAG_PLACEHOLDER:   1 << 0,
    FLAG_LOADED:        1 << 1,
    FLAG_LOAD_FAIL:     1 << 2,
    FLAG_IS_VIDEO:      1 << 3,
    FLAG_IS_FAVORITE:   1 << 4,
    FLAG_IS_FOLDER:     1 << 5,
    FLAG_SELECTED:      1 << 6,
    FLAG_LEAVING:       1 << 7,
    FLAG_EXIT_LEFT:     1 << 8,
    FLAG_ENTER_RIGHT:   1 << 9,
    FLAG_FORCE_RELOAD:  1 << 10,
};