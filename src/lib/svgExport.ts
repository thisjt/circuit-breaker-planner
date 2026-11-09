export function buildExportableSvg(): {
  clonedSvg: SVGSVGElement;
  width: number;
  height: number;
} | null {
  if (typeof document === 'undefined') return null;
  const svg = (document.getElementById('circuit-diagram-svg') ||
    document.querySelector('svg')) as SVGSVGElement | null;
  if (!svg) return null;

  let exportX = 0;
  let exportY = 0;
  let exportWidth = svg.clientWidth || 1200;
  let exportHeight = svg.clientHeight || 800;

  const contentLayer = svg.querySelector(
    '#canvas-content-layer'
  ) as SVGGraphicsElement | null;
  if (contentLayer) {
    try {
      const bbox = contentLayer.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        const margin = 60;
        exportX = Math.floor(bbox.x - margin);
        exportY = Math.floor(bbox.y - margin);
        exportWidth = Math.ceil(bbox.width + margin * 2);
        exportHeight = Math.ceil(bbox.height + margin * 2);
      }
    } catch {
      // Fallback to viewport dimensions if getBBox fails
    }
  }

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('width', String(exportWidth));
  clonedSvg.setAttribute('height', String(exportHeight));
  clonedSvg.setAttribute(
    'viewBox',
    `${exportX} ${exportY} ${exportWidth} ${exportHeight}`
  );

  // Inline essential styles so standalone SVG/PNG/Print rendering preserves fonts and hides hover-only indicators
  const styleEl = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'style'
  );
  styleEl.textContent = `
    svg { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .uppercase { text-transform: uppercase; }
    .tracking-wider { letter-spacing: 0.05em; }
    .tracking-widest { letter-spacing: 0.1em; }
    .opacity-0 { opacity: 0; }
  `;
  clonedSvg.insertBefore(styleEl, clonedSvg.firstChild);

  const clonedPattern = clonedSvg.querySelector('#grid');
  if (clonedPattern) {
    clonedPattern.setAttribute('patternTransform', '');
  }

  const clonedGridRect = clonedSvg.querySelector('#canvas-grid-bg');
  if (clonedGridRect && clonedGridRect.parentNode) {
    clonedGridRect.setAttribute('x', String(exportX));
    clonedGridRect.setAttribute('y', String(exportY));
    clonedGridRect.setAttribute('width', String(exportWidth));
    clonedGridRect.setAttribute('height', String(exportHeight));

    const solidBg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'rect'
    );
    solidBg.setAttribute('x', String(exportX));
    solidBg.setAttribute('y', String(exportY));
    solidBg.setAttribute('width', String(exportWidth));
    solidBg.setAttribute('height', String(exportHeight));
    solidBg.setAttribute('fill', '#020617');
    clonedGridRect.parentNode.insertBefore(solidBg, clonedGridRect);
  }

  const clonedContentLayer = clonedSvg.querySelector('#canvas-content-layer');
  if (clonedContentLayer) {
    clonedContentLayer.setAttribute('transform', '');
  }

  return { clonedSvg, width: exportWidth, height: exportHeight };
}

export function getSerializedDiagramSvg(): {
  svgMarkup: string;
  width: number;
  height: number;
} | null {
  const exported = buildExportableSvg();
  if (!exported) return null;
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(exported.clonedSvg);
  return {
    svgMarkup,
    width: exported.width,
    height: exported.height
  };
}

export function exportDiagramAsSVG(filenameBase: string) {
  const serialized = getSerializedDiagramSvg();
  if (!serialized) return;
  const blob = new Blob([serialized.svgMarkup], {
    type: 'image/svg+xml;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = filenameBase.toLowerCase().replace(/[^a-z0-9-_]+/g, '_');
  a.download = `${safeName}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDiagramAsPNG(filenameBase: string) {
  const serialized = getSerializedDiagramSvg();
  if (!serialized) return;
  const { svgMarkup, width, height } = serialized;

  const svgBlob = new Blob([svgMarkup], {
    type: 'image/svg+xml;charset=utf-8'
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new window.Image();
  img.onload = () => {
    const scale = Math.max(
      1,
      Math.min(2, Math.floor(8192 / Math.max(width, height, 1)))
    );
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = pngUrl;
      const safeName = filenameBase.toLowerCase().replace(/[^a-z0-9-_]+/g, '_');
      a.download = `${safeName}_diagram.png`;
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

