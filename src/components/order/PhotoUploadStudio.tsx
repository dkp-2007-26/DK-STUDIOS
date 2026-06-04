import { useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { ArrowDown, ArrowUp, Crop as CropIcon, GripHorizontal, ImagePlus, Trash2 } from "lucide-react";

export interface EditablePhotoAsset {
  id: string;
  file: File;
  previewUrl: string;
  crop: Crop | null;
}

interface PhotoUploadStudioProps {
  assets: EditablePhotoAsset[];
  onChange: (assets: EditablePhotoAsset[]) => void;
}

function createCenteredCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      mediaWidth / mediaHeight || 1,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

async function cropImage(file: File, crop: Crop) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not load image for cropping."));
      element.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = Math.max(1, Math.floor((crop.width ?? 0) * scaleX));
    canvas.height = Math.max(1, Math.floor((crop.height ?? 0) * scaleY));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available.");
    }

    context.drawImage(
      image,
      Math.floor((crop.x ?? 0) * scaleX),
      Math.floor((crop.y ?? 0) * scaleY),
      Math.floor((crop.width ?? 0) * scaleX),
      Math.floor((crop.height ?? 0) * scaleY),
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, file.type || "image/jpeg", 0.92),
    );
    if (!blob) {
      throw new Error("Could not create cropped image.");
    }

    return new File([blob], file.name, { type: blob.type || file.type });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export default function PhotoUploadStudio({ assets, onChange }: PhotoUploadStudioProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftCrop, setDraftCrop] = useState<Crop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => () => {
    assets.forEach((asset) => URL.revokeObjectURL(asset.previewUrl));
  }, []);

  const currentAsset = useMemo(
    () => assets.find((asset) => asset.id === editingId) ?? null,
    [assets, editingId],
  );

  const onDrop = (acceptedFiles: File[]) => {
    const next = acceptedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
      crop: null,
    }));
    onChange([...assets, ...next].slice(0, 20));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  const removeAsset = (id: string) => {
    const asset = assets.find((item) => item.id === id);
    if (asset) {
      URL.revokeObjectURL(asset.previewUrl);
    }
    onChange(assets.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraftCrop(null);
    }
  };

  const moveAsset = (id: string, direction: -1 | 1) => {
    const index = assets.findIndex((item) => item.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= assets.length) {
      return;
    }
    const next = [...assets];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange(next);
  };

  const openCropper = (asset: EditablePhotoAsset) => {
    setEditingId(asset.id);
    setDraftCrop(asset.crop);
  };

  const saveCrop = async () => {
    if (!currentAsset || !draftCrop?.width || !draftCrop?.height) {
      setEditingId(null);
      return;
    }
    const croppedFile = await cropImage(currentAsset.file, draftCrop);
    const nextPreview = URL.createObjectURL(croppedFile);
    onChange(
      assets.map((asset) =>
        asset.id === currentAsset.id
          ? {
              ...asset,
              file: croppedFile,
              previewUrl: nextPreview,
              crop: draftCrop,
            }
          : asset,
      ),
    );
    URL.revokeObjectURL(currentAsset.previewUrl);
    setEditingId(null);
    setDraftCrop(null);
  };

  return (
    <div className="space-y-5">
      <div
        {...getRootProps()}
        className={`rounded-3xl border border-dashed p-8 text-center transition-all ${
          isDragActive
            ? "border-gold-400 bg-gold-900/10"
            : "border-white/10 bg-dark-200 hover:border-gold-700/40"
        }`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-900/20 text-gold-300">
          <ImagePlus size={24} />
        </div>
        <p className="text-white font-semibold">Drop your photos here or click to browse</p>
        <p className="mt-2 text-sm text-gray-500">Crop, preview, and reorder before you submit.</p>
      </div>

      {assets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assets.map((asset, index) => (
            <div key={asset.id} className="rounded-2xl border border-white/5 bg-dark-200 p-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black">
                <img src={asset.previewUrl} alt={asset.file.name} className="h-44 w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white">
                  {index + 1}
                </span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{asset.file.name}</p>
                  <p className="text-xs text-gray-500">{Math.round(asset.file.size / 1024)} KB</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveAsset(asset.id, -1)} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveAsset(asset.id, 1)} className="rounded-lg border border-white/10 p-2 text-gray-400 hover:text-white">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" onClick={() => openCropper(asset)} className="rounded-lg border border-white/10 p-2 text-gold-400 hover:text-gold-300">
                    <CropIcon size={14} />
                  </button>
                  <button type="button" onClick={() => removeAsset(asset.id)} className="rounded-lg border border-red-900/40 p-2 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <GripHorizontal size={12} />
                Final upload order follows the card order here.
              </div>
            </div>
          ))}
        </div>
      )}

      {currentAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4" onClick={() => setEditingId(null)}>
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-dark-300 p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Crop Preview</p>
                <p className="text-sm text-gray-500">{currentAsset.file.name}</p>
              </div>
              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-400">
                Close
              </button>
            </div>

            <div className="overflow-auto rounded-2xl bg-black p-3">
              <ReactCrop crop={draftCrop ?? undefined} onChange={(crop) => setDraftCrop(crop)}>
                <img
                  ref={imageRef}
                  src={currentAsset.previewUrl}
                  alt={currentAsset.file.name}
                  className="max-h-[70vh] w-full object-contain"
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    if (!draftCrop) {
                      setDraftCrop(createCenteredCrop(target.width, target.height));
                    }
                  }}
                />
              </ReactCrop>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300">
                Cancel
              </button>
              <button type="button" onClick={() => void saveCrop()} className="rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 px-4 py-2 text-sm font-semibold text-black">
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
