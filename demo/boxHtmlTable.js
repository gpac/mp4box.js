function generatePropertyValue(prop, value) {
  if (prop === 'data') {
    const byteDisplays = [...value].map(byte => byte.toString(16).padStart(2, '0'));
    const groupsOf4 = [];
    for (let i = 0; i < byteDisplays.length; i += 4) {
      groupsOf4.push(byteDisplays.slice(i, i + 4).join(''));
    }
    return groupsOf4.join(' ');
  }

  // Check if we explicitly have a toHTML method
  if (typeof value?.toHTML === 'function') {
    return value.toHTML();
  }

  // Check if we explicitly have a toString method
  if (typeof value?.toString === 'function') {
    const content = value.toString();
    //  if (value.hasOwnProperty('toString') || content.startsWith('<')) {
    return content;
    //  }
  }

  // Display arrays concisely
  const TypedArray = Object.getPrototypeOf(Uint8Array);
  if (Array.isArray(value) || value instanceof TypedArray) {
    const inners = value.map(inner => generatePropertyValue(prop, inner));
    return `[${inners.join(', ')}]`;
  }

  // Display strings or numbers directly
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  // Try to stringify with JSON
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    // If JSON.stringify fails, return the value directly
    return value;
  }
}

const propsToSkip = [
  'hdr_size',
  'boxes',
  'subBoxNames',
  'entries',
  'samples',
  'references',
  'items',
  'item_infos',
  'extents',
  'associations',
  'esd',
  'descs',
  'levels',
  'subsegments',
  'props',
];

function generatePropRow(prop, box, excluded_fields) {
  const value = box[prop];
  if (propsToSkip.includes(prop)) {
    return '';
  } else if (excluded_fields && excluded_fields.indexOf(prop) > -1) {
    return '';
  } else if (value instanceof Box) {
    return '';
  } else if (typeof value === 'undefined') {
    return '';
  } else if (typeof value === 'function') {
    return '';
  } else if (box.subBoxNames && box.subBoxNames.indexOf(prop.slice(0, 4)) > -1) {
    return '';
  } else {
    return `<tr>
      <td><code>${prop}</code></td>
      <td><code>${generatePropertyValue(prop, value)}</code></td>
    </tr>`;
  }
}

function generateBoxTable(box, excluded_fields, additional_props, no_header) {
  var prop;
  var html = '<table>';
  if (!no_header) {
    html += '<thead>';
    html += '<tr>';
    html += '<th>';
    html += 'Property name';
    html += '</th>';
    html += '<th>';
    html += 'Property value';
    html += '</th>';
    html += '</tr>';
    html += '</thead>';
  }
  html += '<tbody>';

  for (prop in box) {
    html += generatePropRow(prop, box, excluded_fields);
  }

  if (additional_props) {
    for (prop in additional_props) {
      html += '<tr>';
      html += '<td><code>';
      html += prop;
      html += '</code></td>';
      html += '<td><code>';
      html += additional_props[prop];
      html += '</code></td>';
      html += '</tr>';
    }
  }

  html += '</tbody>';
  html += '</table>';
  return html;
}
