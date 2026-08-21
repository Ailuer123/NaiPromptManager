import React, { useRef, useState } from 'react';
import { dataUriHasAlpha } from '../services/pngAlpha';
import { BatteryBar } from './NaiBatteryBar';
import { Button, Chip } from './ui';
import { cx } from './ui/cx';

interface ChainEditorPreviewProps {
    isGenerating: boolean;
    handleGenerate: () => void;
    errorMsg: string | null;
    generatedImage: string | null;
    previewImage: string | undefined;
    setLightboxImg: (img: string | null) => void;
    isOwner: boolean;
    isUploading: boolean;
    handleSavePreview: () => void;
    handleUploadCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
    getDownloadFilename: () => string;
    hideCoverActions?: boolean;
    transparentPreview?: boolean;
    stream?: boolean;
    onToggleStream?: () => void;
    streamDisabled?: boolean;
}

export const ChainEditorPreview: React.FC<ChainEditorPreviewProps> = ({
    isGenerating,
    handleGenerate,
    errorMsg,
    generatedImage,
    previewImage,
    setLightboxImg,
    isOwner,
    isUploading,
    handleSavePreview,
    handleUploadCover,
    getDownloadFilename,
    hideCoverActions,
    transparentPreview,
    stream,
    onToggleStream,
    streamDisabled,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const shown = generatedImage || previewImage;
    const checker = Boolean(transparentPreview || (generatedImage && dataUriHasAlpha(generatedImage)));

    const handleDownload = async (imageUrl: string, filename: string) => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`下载失败: ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('下载失败:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <aside className="editor-side">
            <section className="panel surface-strong">
                <div
                    className={cx('preview-frame', shown && 'has-result', checker && 'checker')}
                    onClick={() => { if (shown) setLightboxImg(shown); }}
                >
                    {generatedImage ? (
                        <img src={generatedImage} alt="已生成" />
                    ) : previewImage ? (
                        <img src={previewImage} alt="封面" />
                    ) : (
                        <div className="shade" />
                    )}
                    {generatedImage ? null : previewImage ? <div className="shade" /> : null}
                </div>
                {errorMsg && <p className="hint is-error">{errorMsg}</p>}
                <div className="preview-toolbar">
                    <BatteryBar />
                    <div className="preview-gen-row">
                        <Button variant="primary" loading={isGenerating} onClick={handleGenerate}>
                            {isGenerating ? '生成中' : '生成预览'}
                        </Button>
                        <Chip
                            active={!!stream}
                            disabled={streamDisabled}
                            onClick={() => onToggleStream?.()}
                        >
                            流式预览
                        </Chip>
                    </div>
                    <div className="preview-actions">
                        {shown && (
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={isDownloading}
                                onClick={() => handleDownload(shown, getDownloadFilename())}
                            >
                                {isDownloading ? '下载中' : generatedImage ? '下载' : '下载封面'}
                            </Button>
                        )}
                        {isOwner && !hideCoverActions && generatedImage && (
                            <Button variant="secondary" size="sm" disabled={isUploading} onClick={handleSavePreview}>
                                {isUploading ? '上传中' : '设为封面'}
                            </Button>
                        )}
                        {isOwner && !hideCoverActions && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUploadCover}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={isUploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? '上传中' : '上传封面'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </aside>
    );
};
