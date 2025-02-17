import { IFileInfo } from './types';
import { genFileInfo } from './utils'
/**
 * Get file infos for list of files given Ids
 * @param fileIds list of file ids
 * @returns list of file infos
 */
 export async function getFiles(fileIds: number[]): Promise<IFileInfo[]> {
    // const prefixPath = `/files/${getCurrentUser()!.uid}`;
    const prefixPath = ``;

    // IMPORTANT: if this isn't there, then a blank
    // returns EVERYTHING on the server!
    if (fileIds.length === 0) {
        return [];
    }

    // let response: any = await client.getDirectoryContents(fileIds);
    let response: any = await new Promise(resolve => setTimeout(() => {
        resolve({ data: [] });
    }, 200)); // mock
    return response.data
        .map((data: any) => genFileInfo(data))
        .map((data: any) => Object.assign({}, data, { filename: data.filename.replace(prefixPath, '') }));
}

/**
 * Delete a single file
 *
 * @param path path to the file
 */
 export async function deleteFile(path: string) {
    // const prefixPath = `/files/${getCurrentUser()!.uid}`;
    // return await client.deleteFile(`${prefixPath}${path}`);
    console.log(`deleteFile->`,path)
    return await new Promise(resolve => setTimeout(resolve, 200));
}
/**
 * Run promises in parallel, but only n at a time
 * @param promises Array of promise generator funnction (async functions)
 * @param n Number of promises to run in parallel
 */
 export async function* runInParallel<T>(promises: (() => Promise<T>)[], n: number) {
    while (promises.length > 0) {
        const promisesToRun = promises.splice(0, n);
        const resultsForThisBatch = await Promise.all(promisesToRun.map(p => p()));
        yield resultsForThisBatch;
    }
    return;
}
/**
 * Delete all files in a given list of Ids
 *
 * @param fileIds list of file ids
 * @returns list of file ids that were deleted
 */
export async function* deleteFilesByIds(fileIds: number[]) {
    const fileIdsSet = new Set(fileIds);

    if (fileIds.length === 0) {
        return;
    }
    // Get files data
    let fileInfos: any[] = [];
    try {
        fileInfos = await getFiles(fileIds.filter(f => f));
    } catch (e) {
        console.error('Failed to get file info for files to delete', fileIds, e);
        return;
    }
    // fileInfos = fileInfos.filter((f) => fileIdsSet.has(f.fileid));
    fileInfos = fileIds // mock data
    const calls = fileInfos.map((fileInfo) => async () => {
        try {
            // await deleteFile(fileInfo.filename); 
            await deleteFile(fileInfo); // mock data
            // return fileInfo.fileid as number;
            return fileInfo as number;
        } catch {
            console.error('Failed to delete', fileInfo.filename)
            return 0;
        }
    });
    yield* runInParallel(calls, 10);
}