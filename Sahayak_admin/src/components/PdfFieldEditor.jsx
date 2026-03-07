/**
 * PdfFieldEditor — Visual drag-and-drop coordinate editor for PDF form fields.
 *
 * Renders each PDF page on a <canvas> via PDF.js, then overlays draggable /
 * resizable field boxes that map to the field_coordinates dict.
 *
 * Props:
 *   pdfUrl        – URL (or blob URL) of the PDF to render
 *   fields        – array of { id, label, type, required }
 *   coordinates   – { [field_id]: { page, x, y, box_width, box_height, input_y } }
 *   onChange       – (newCoordinates) => void
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

// ── Constants ─────────────────────────────────────────────────────────────────
const RENDER_SCALE = 1.5;            // Canvas resolution multiplier
const MIN_BOX_W = 30;
const MIN_BOX_H = 12;
const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const ptToPx = (pt, scale) => pt * scale;
const pxToPt = (px, scale) => px / scale;

// ── Component ─────────────────────────────────────────────────────────────────
const PdfFieldEditor = ({ pdfUrl, fields = [], coordinates = {}, onChange }) => {
  const containerRef = useRef(null);
  const [pages, setPages] = useState([]);          // [{ canvas, width, height }]
  const [pdfScale, setPdfScale] = useState(1);      // ratio: displayed px per PDF pt
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePage, setActivePage] = useState(0);
  const [selectedField, setSelectedField] = useState(null);
  const [dragState, setDragState] = useState(null);  // { fieldId, startX, startY, origX, origY }
  const [resizeState, setResizeState] = useState(null);
  const [zoom, setZoom] = useState(1);

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    (async () => {
      try {
        const loadTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadTask.promise;
        const pageData = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;
          // Store the PDF-point dimensions (72 DPI)
          const origViewport = page.getViewport({ scale: 1 });
          pageData.push({
            dataUrl: canvas.toDataURL(),
            pdfWidth: origViewport.width,    // in PDF points
            pdfHeight: origViewport.height,
          });
        }
        if (!cancelled) {
          setPages(pageData);
          setActivePage(0);
        }
      } catch (e) {
        console.error('[PdfFieldEditor] load error', e);
        if (!cancelled) setError('Failed to load PDF: ' + (e.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  // ── Compute display scale whenever page / container / zoom changes ────────
  useEffect(() => {
    if (!pages.length || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 40; // padding
    const currentPage = pages[activePage] || pages[0];
    const baseScale = containerWidth / currentPage.pdfWidth;
    setPdfScale(baseScale * zoom);
  }, [pages, activePage, zoom]);

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const getBoxStyle = useCallback((fieldId) => {
    const coord = coordinates[fieldId];
    if (!coord) return null;
    const pg = coord.page ?? 0;
    if (pg !== activePage) return null;

    const x = ptToPx(coord.x, pdfScale);
    const y = ptToPx(coord.input_y ?? coord.y, pdfScale);
    const w = ptToPx(coord.box_width ?? 200, pdfScale);
    const h = ptToPx(coord.box_height ?? 16, pdfScale);
    return { left: x, top: y, width: w, height: h };
  }, [coordinates, activePage, pdfScale]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const startDrag = (e, fieldId) => {
    e.stopPropagation();
    e.preventDefault();
    const coord = coordinates[fieldId];
    if (!coord) return;
    setSelectedField(fieldId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragState({
      fieldId,
      startX: clientX,
      startY: clientY,
      origX: coord.x,
      origInputY: coord.input_y ?? coord.y,
    });
  };

  const startResize = (e, fieldId) => {
    e.stopPropagation();
    e.preventDefault();
    const coord = coordinates[fieldId];
    if (!coord) return;
    setSelectedField(fieldId);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setResizeState({
      fieldId,
      startX: clientX,
      startY: clientY,
      origW: coord.box_width ?? 200,
      origH: coord.box_height ?? 16,
    });
  };

  useEffect(() => {
    if (!dragState && !resizeState) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (dragState) {
        const dx = pxToPt(clientX - dragState.startX, pdfScale);
        const dy = pxToPt(clientY - dragState.startY, pdfScale);
        const newX = Math.max(0, dragState.origX + dx);
        const newInputY = Math.max(0, dragState.origInputY + dy);
        onChange({
          ...coordinates,
          [dragState.fieldId]: {
            ...coordinates[dragState.fieldId],
            x: Math.round(newX * 100) / 100,
            input_y: Math.round(newInputY * 100) / 100,
          },
        });
      }

      if (resizeState) {
        const dx = pxToPt(clientX - resizeState.startX, pdfScale);
        const dy = pxToPt(clientY - resizeState.startY, pdfScale);
        const newW = Math.max(MIN_BOX_W, resizeState.origW + dx);
        const newH = Math.max(MIN_BOX_H, resizeState.origH + dy);
        onChange({
          ...coordinates,
          [resizeState.fieldId]: {
            ...coordinates[resizeState.fieldId],
            box_width: Math.round(newW * 100) / 100,
            box_height: Math.round(newH * 100) / 100,
          },
        });
      }
    };

    const handleUp = () => {
      setDragState(null);
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragState, resizeState, pdfScale, coordinates, onChange]);

  // ── Place unpositioned field at click location ────────────────────────────
  const handleCanvasClick = (e) => {
    if (!selectedField) return;
    const coord = coordinates[selectedField];
    if (coord) return; // already placed

    const rect = e.currentTarget.getBoundingClientRect();
    const x = pxToPt(e.clientX - rect.left, pdfScale);
    const y = pxToPt(e.clientY - rect.top, pdfScale);
    onChange({
      ...coordinates,
      [selectedField]: {
        page: activePage,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        input_y: Math.round(y * 100) / 100,
        box_width: 200,
        box_height: 16,
      },
    });
  };

  // ── Auto-place all unpositioned fields ────────────────────────────────────
  const autoPlaceAll = () => {
    const next = { ...coordinates };
    let yOffset = 50;
    fields.forEach((f) => {
      if (!next[f.id]) {
        next[f.id] = {
          page: activePage,
          x: 60,
          y: yOffset,
          input_y: yOffset,
          box_width: 200,
          box_height: 16,
        };
        yOffset += 28;
      }
    });
    onChange(next);
  };

  // ── Remove field coordinates ──────────────────────────────────────────────
  const removeCoord = (fieldId) => {
    const next = { ...coordinates };
    delete next[fieldId];
    onChange(next);
  };

  const currentPage = pages[activePage];
  const displayW = currentPage ? ptToPx(currentPage.pdfWidth, pdfScale) : 0;
  const displayH = currentPage ? ptToPx(currentPage.pdfHeight, pdfScale) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-3" />
        Loading PDF…
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 rounded-lg p-4">{error}</div>;
  }

  if (!pdfUrl) {
    return (
      <div className="text-sm text-gray-400 text-center py-12">
        No PDF uploaded. Use the <strong>OCR Scan</strong> tab to upload a form first.
      </div>
    );
  }

  if (pages.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-sm">
          {/* Page selector */}
          {pages.length > 1 && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">Page:</span>
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePage(i)}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    i === activePage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
          {/* Zoom */}
          <div className="flex items-center space-x-1 ml-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-xs">−</button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-xs">+</button>
          </div>
        </div>
        <button
          type="button"
          onClick={autoPlaceAll}
          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
        >
          Auto-place unpositioned fields
        </button>
      </div>

      <div className="flex gap-4">
        {/* ── Field list sidebar ──────────────────────────────────────────── */}
        <div className="w-56 flex-shrink-0 space-y-1 max-h-[600px] overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fields</p>
          {fields.map((f, idx) => {
            const hasCoord = !!coordinates[f.id];
            const isActive = selectedField === f.id;
            const color = COLORS[idx % COLORS.length];
            return (
              <div
                key={f.id}
                onClick={() => setSelectedField(f.id)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                  isActive
                    ? 'border-blue-400 bg-blue-50'
                    : hasCoord
                    ? 'border-green-200 bg-green-50 hover:bg-green-100'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{f.label || `Field ${idx + 1}`}</span>
                </div>
                {hasCoord ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCoord(f.id); }}
                    className="text-red-400 hover:text-red-600 px-1"
                    title="Remove position"
                  >✕</button>
                ) : (
                  <span className="text-gray-300 text-[10px]">click PDF</span>
                )}
              </div>
            );
          })}
          {fields.length === 0 && (
            <p className="text-xs text-gray-400 italic">No fields defined. Add fields in the Field Builder tab first.</p>
          )}
        </div>

        {/* ── PDF canvas with overlays ────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-gray-100"
          style={{ maxHeight: 600 }}
        >
          <div
            className="relative inline-block"
            style={{ width: displayW, height: displayH }}
            onClick={handleCanvasClick}
          >
            {/* PDF page image */}
            <img
              src={currentPage.dataUrl}
              alt={`Page ${activePage + 1}`}
              style={{ width: displayW, height: displayH }}
              draggable={false}
              className="select-none"
            />

            {/* Field overlay boxes */}
            {fields.map((f, idx) => {
              const style = getBoxStyle(f.id);
              if (!style) return null;
              const color = COLORS[idx % COLORS.length];
              const isActive = selectedField === f.id;
              return (
                <div
                  key={f.id}
                  className="absolute select-none"
                  style={{
                    ...style,
                    border: `2px solid ${color}`,
                    backgroundColor: `${color}22`,
                    cursor: dragState?.fieldId === f.id ? 'grabbing' : 'grab',
                    outline: isActive ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    zIndex: isActive ? 20 : 10,
                  }}
                  onMouseDown={(e) => startDrag(e, f.id)}
                  onTouchStart={(e) => startDrag(e, f.id)}
                >
                  {/* Label chip */}
                  <span
                    className="absolute -top-4 left-0 text-[9px] font-semibold px-1 rounded-t whitespace-nowrap text-white"
                    style={{ backgroundColor: color }}
                  >
                    {f.label || `Field ${idx + 1}`}
                  </span>
                  {/* Resize handle */}
                  <div
                    className="absolute -right-1 -bottom-1 w-3 h-3 rounded-full cursor-se-resize"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => startResize(e, f.id)}
                    onTouchStart={(e) => startResize(e, f.id)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coordinate summary */}
      {selectedField && coordinates[selectedField] && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 flex items-center gap-4">
          <span className="font-medium text-gray-700">{fields.find(f => f.id === selectedField)?.label || selectedField}</span>
          <span>Page {(coordinates[selectedField].page ?? 0) + 1}</span>
          <span>X: {coordinates[selectedField].x?.toFixed(1)}</span>
          <span>Y: {(coordinates[selectedField].input_y ?? coordinates[selectedField].y)?.toFixed(1)}</span>
          <span>W: {(coordinates[selectedField].box_width ?? 200).toFixed(1)}</span>
          <span>H: {(coordinates[selectedField].box_height ?? 16).toFixed(1)}</span>
        </div>
      )}
    </div>
  );
};

export default PdfFieldEditor;
