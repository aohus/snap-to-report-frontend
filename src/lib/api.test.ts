import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';
import * as imageUtils from './image';
import * as uploadStrategies from './uploadStrategies';
import { AuthService } from './auth';

// Mock dependencies
vi.mock('./image', () => ({
    compressImage: vi.fn(),
    isJPEGFile: vi.fn(),
}));

vi.mock('./uploadStrategies', () => ({
    uploadViaResumable: vi.fn(),
    uploadViaPresigned: vi.fn(),
    uploadViaServer: vi.fn(),
}));

vi.mock('./auth', () => ({
    AuthService: {
        getToken: vi.fn(() => 'fake-token'),
        setToken: vi.fn(),
        logout: vi.fn(),
    }
}));

describe('api.ts uploadPhotos', () => {
    const jobId = 'job-123';
    const originalFetch = global.fetch;

    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should handle successful upload flow with presigned strategy', async () => {
        // Arrange
        const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
        const file2 = new File(['content2'], 'test2.png', { type: 'image/png' });
        const files = [file1, file2];

        // 1. Mock Compression
        (imageUtils.isJPEGFile as any).mockReturnValueOnce(true).mockReturnValueOnce(false);
        (imageUtils.compressImage as any).mockResolvedValue(new File(['compressed'], 'test1.jpg', { type: 'image/jpeg' }));

        // 2. Mock getUploadUrls (Step 2 in api.ts)
        const presignedResponse = {
            strategy: 'presigned',
            urls: [
                { filename: 'test1.jpg', upload_url: 'http://put-url-1', storage_path: 'path/to/1' },
                { filename: 'test2.png', upload_url: 'http://put-url-2', storage_path: 'path/to/2' }
            ]
        };

        // 3. Mock notifyUploadComplete response
        const photosResponse = [{ id: 'p1', url: 'url1' }, { id: 'p2', url: 'url2' }];

        // 4. Mock getPhotos response (Final step)
        const finalPhotos = [{ id: 'p1' }, { id: 'p2' }];


        // Mock fetch calls in order
        (global.fetch as any)
            .mockResolvedValueOnce(new Response(JSON.stringify(presignedResponse), { status: 200 })) // getUploadUrls
            .mockResolvedValueOnce(new Response(JSON.stringify(photosResponse), { status: 200 })) // notifyUploadComplete
            .mockResolvedValueOnce(new Response(JSON.stringify(finalPhotos), { status: 200 })); // getPhotos

        // Act
        const result = await api.uploadPhotos(jobId, files);

        // Assert
        expect(imageUtils.compressImage).toHaveBeenCalled(); // Should attempt compression
        expect(uploadStrategies.uploadViaPresigned).toHaveBeenCalledTimes(2); // Should upload 2 files
        expect(uploadStrategies.uploadViaPresigned).toHaveBeenCalledWith(expect.anything(), 'http://put-url-1', expect.anything());
        expect(uploadStrategies.uploadViaPresigned).toHaveBeenCalledWith(expect.anything(), 'http://put-url-2', expect.anything());

        // Check notify call
        const notifyCall = (global.fetch as any).mock.calls.find(call => call[0].includes('/photos/complete'));
        expect(notifyCall).toBeTruthy();
        expect(JSON.parse(notifyCall[1].body)).toHaveLength(2);

        // uploadPhotos returns void
        expect(result).toBeUndefined();
    });

    it('should handle failure if getUploadUrls fails', async () => {
        // Arrange
        const file1 = new File(['content'], 'test1.png', { type: 'image/png' });
        const files = [file1];

        (imageUtils.isJPEGFile as any).mockReturnValue(false);

        // Mock getUploadUrls failure
        (global.fetch as any).mockResolvedValueOnce(new Response(null, { status: 500, statusText: 'Server Error' }));

        // Act
        await api.uploadPhotos(jobId, files);

        // Assert: It should just stop and not attempt upload
        expect(uploadStrategies.uploadViaServer).not.toHaveBeenCalled();
        expect(uploadStrategies.uploadViaPresigned).not.toHaveBeenCalled();
    });
});
