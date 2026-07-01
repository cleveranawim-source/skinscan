import { roiChipLabels } from '../lib/constants';

export function GuideFrame({ imageUrl, mode = 'guide', rois }) {
  return (
    <div className={`guide-frame ${imageUrl ? 'with-photo' : ''}`}>
      {imageUrl ? <img src={imageUrl} alt="업로드한 얼굴 사진" /> : <div className="camera-grid" />}
      <div className="oval-guide" />
      {mode === 'analysis' && rois && (
        <div className="roi-layer" aria-hidden="true">
          {Object.entries(roiChipLabels).map(([key, label]) => {
            const roi = rois[key];
            if (!roi) return null;
            return (
              <span className="roi-chip" key={key} style={{ left: `${roi.xPct}%`, top: `${roi.yPct}%` }}>
                {label}
              </span>
            );
          })}
        </div>
      )}
      {mode === 'scan' && <div className="scan-beam" />}
    </div>
  );
}
