const linesContainer = document.querySelector('.lines-container');
const line = document.querySelector('.line');
const template = line.cloneNode(true);
const addButton = linesContainer.querySelector('.add-line');

const lineColors = ['#a83232', '#34a832', '#3236a8', '#a832a6', '#a89932', '#a85632', '#329da8', '#525c69'];

const layers = [];

function persistState(lines) {
  history.pushState(null, '', `#${encodeURIComponent(JSON.stringify(lines))}`);
}

function render(lines, fitToBounds) {
  // reset all layers
  while (layers.length) {
    const layer = layers.pop();
    layer.remove();
  }

  const allBounds = []; // We use this to zoom the map after all lines are plotted

  lines.forEach((line, i) => {
    if (!line.shape || line.hide) return;

    const mul = line.polyline6 ? 1e6 : 1e5;

    const shape = line.unescape ? line.shape.replace(/\\\\/g, '\\') : line.shape;

    const decoded = decode(shape, mul);
    layers.push(
      L.polyline(decoded, {
        color: lineColors[i % lineColors.length],
        opacity: '0.6',
      }).addTo(map),
    );

    const icon = L.icon({
      iconUrl: 'round_marker.svg',
      iconSize: [8, 8],
    });

    const start = L.icon({
      iconUrl: 'marker.svg',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    // render markers
    decoded.forEach((x) => {
      layers.push(
        L.marker(x, {
          icon,
          title: `${x[0]},${x[1]}`,
        }).addTo(map),
      );

      allBounds.push(x);
    });

    // render Start
    layers.push(
      L.marker(decoded[0], {
        icon: start,
      }).addTo(map),
    );

    //fit it in view
    if (fitToBounds) {
      map.fitBounds(allBounds);
    }
  });
}

function addLineContainer() {
  linesContainer.insertBefore(template.cloneNode(true), addButton);
}

function keyClickHandler(e) {
  if (e.target.classList.contains('add-line')) {
    addLineContainer();
    return;
  }

  if (e.target.classList.contains('remove-line')) {
    linesContainer.removeChild(e.target.closest('.line'));
  }

  const lines = Array.from(linesContainer.querySelectorAll('.line')).map((x) => ({
    unescape: x.querySelector('[name=unescape]').checked,
    polyline6: x.querySelector('[name=polyline6]').checked,
    hide: x.querySelector('[name=hide]').checked,
    shape: x.querySelector('[name=shape]').value,
  }));

  render(lines, false);
  persistState(lines);
}

linesContainer.addEventListener('keyup', keyClickHandler);
linesContainer.addEventListener('click', keyClickHandler);

// read current state
const state = JSON.parse(decodeURIComponent(location.hash.substring(1)));

state.forEach((line, i) => {
  if (i > 0) {
    linesContainer.insertBefore(template.cloneNode(true), addButton);
  }

  const lastLineElement = linesContainer.querySelector('.line:last-of-type');
  lastLineElement.querySelector('[name=unescape]').checked = line.unescape;
  lastLineElement.querySelector('[name=polyline6]').checked = line.polyline6;
  lastLineElement.querySelector('[name=shape]').value = line.shape;
});

if (state.length) render(state, true);

window.addEventListener('hashchange', () => {
  render(state, true);
})
