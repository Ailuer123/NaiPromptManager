import { describe, expect, it } from 'vitest';
import { dataUriHasAlpha } from './pngAlpha';
import { shouldApplyAutoJpgSave } from './imageCompression';

function pngDataUri(colorType: number): string {
    const bytes = new Uint8Array(26);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    bytes[25] = colorType;
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return `data:image/png;base64,${btoa(binary)}`;
}

describe('shouldApplyAutoJpgSave', () => {
    it('开关关闭时不压缩', () => {
        expect(shouldApplyAutoJpgSave({ enabled: false, preserveAlpha: false })).toBe(false);
    });

    it('V5 透明背景需要保留 alpha 时跳过', () => {
        expect(shouldApplyAutoJpgSave({ enabled: true, preserveAlpha: true })).toBe(false);
    });

    it('开关开启且不需要透明时压缩，即使 PNG 是 NAI 默认的 RGBA color type', () => {
        const naiLikePng = pngDataUri(6);
        expect(dataUriHasAlpha(naiLikePng)).toBe(true);
        expect(shouldApplyAutoJpgSave({ enabled: true, preserveAlpha: false })).toBe(true);
    });
});
