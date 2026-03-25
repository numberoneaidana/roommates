import React from 'react';

/**
 * MapDrawingControls - UI buttons for shape drawing modes
 * Provides visual controls matching krisha.kz design
 */
const MapDrawingControls = ({ 
  drawingMode = null,
  isDrawing = false,
  drawnAreas = [],
  onPolygonClick = () => {},
  onCircleClick = () => {},
  onFreehandClick = () => {},
  onClearClick = () => {},
  onRemoveArea = () => {}
}) => {
  const colors = {
    matcha: '#7A9E7E',
    matchaLight: '#C8DEC4',
    matchaPale: '#E4F0E0',
    white: '#FFFFFF',
    ink: '#1C2B1E',
    ink30: 'rgba(28,43,30,0.3)',
  };

  const styles = `
    .map-drawing-controls {
      position: absolute;
      top: 20px;
      left: 20px;
      background: ${colors.white};
      border: 1px solid ${colors.matchaLight};
      border-radius: 12px;
      padding: 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      z-index: 1000;
      flex-wrap: wrap;
      max-width: 500px;
      pointer-events: auto;
    }

    .map-drawing-controls label {
      font-family: 'Geologica', sans-serif;
      font-size: 0.7rem;
      font-weight: 500;
      color: ${colors.ink30};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 8px;
    }

    .drawing-tool-btn {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 1.5px solid ${colors.matchaLight};
      background: ${colors.white};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      color: ${colors.ink};
      font-size: 1.2rem;
      font-weight: 600;
    }

    .drawing-tool-btn:hover {
      border-color: ${colors.matcha};
      background: ${colors.matchaMist};
      transform: scale(1.05);
    }

    .drawing-tool-btn.active {
      background: ${colors.matcha};
      color: ${colors.white};
      border-color: ${colors.matcha};
      box-shadow: 0 2px 8px rgba(122, 158, 126, 0.3);
    }

    .drawing-tool-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .drawing-tool-btn[title] {
      position: relative;
    }

    .drawing-tool-btn[title]:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors.ink};
      color: ${colors.white};
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.65rem;
      white-space: nowrap;
      margin-bottom: 8px;
      pointer-events: none;
      z-index: 1000;
    }

    .drawing-areas-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      padding: 0 8px;
      border-left: 1px solid ${colors.matchaLight};
      max-width: 300px;
    }

    .area-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 0.7rem;
      font-family: 'Geologica', sans-serif;
      color: ${colors.ink};
    }

    .area-badge-remove {
      background: none;
      border: none;
      color: ${colors.ink30};
      cursor: pointer;
      padding: 0;
      font-size: 1rem;
      line-height: 1;
      transition: color 200ms;
    }

    .area-badge-remove:hover {
      color: ${colors.ink};
    }

    .drawing-status {
      font-family: 'Geologica', sans-serif;
      font-size: 0.75rem;
      color: ${colors.ink30};
      padding: 4px 8px;
      border-radius: 6px;
      background: ${colors.matchaMist};
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .clear-all-btn {
      background: ${colors.matchaPale};
      border: 1px solid ${colors.matchaLight};
      color: ${colors.ink};
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Geologica', sans-serif;
      font-size: 0.7rem;
      font-weight: 500;
      transition: all 200ms;
    }

    .clear-all-btn:hover {
      background: ${colors.matchaLight};
      border-color: ${colors.matcha};
    }

    @media (max-width: 600px) {
      .map-drawing-controls {
        top: 10px;
        left: 10px;
        right: 10px;
        padding: 8px;
        gap: 6px;
        max-width: none;
      }

      .drawing-tool-btn {
        width: 36px;
        height: 36px;
        font-size: 1rem;
      }

      .drawing-areas-list {
        max-width: calc(100% - 100px);
      }

      .drawing-areas-list {
        border-left: none;
        border-top: 1px solid ${colors.matchaLight};
        padding-top: 8px;
        margin-top: 8px;
        width: 100%;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div 
        className="map-drawing-controls"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <label>Draw Area</label>
        
        <button
          className={`drawing-tool-btn ${drawingMode === 'freehand' ? 'active' : ''}`}
          onClick={onFreehandClick}
          disabled={isDrawing && drawingMode !== 'freehand'}
          title="Draw Freehand (drag to draw)"
        >
          ✏
        </button>

        {isDrawing && (
          <div className="drawing-status">
            Drawing... press Escape to cancel
          </div>
        )}

        {drawnAreas.length > 0 && (
          <>
            <div className="drawing-areas-list">
              {drawnAreas.map((area) => (
                <div key={area.id} className="area-badge">
                  <span>
                    {area.type === 'freehand' && '✏'}
                  </span>
                  <button
                    className="area-badge-remove"
                    onClick={() => onRemoveArea(area.id)}
                    title="Remove this area"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              className="clear-all-btn"
              onClick={onClearClick}
            >
              Clear All
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default MapDrawingControls;
