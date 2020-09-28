// (C) 2020 Robert Grimm

import { strict as assert } from 'assert';
import expat from 'node-expat';

const { create } = Object;
const identity = v => v;
const print = console.log;
const { stringify } = JSON;

let indent = '';
const doDebug = (opcode, ...data) => {
  switch (opcode) {
    case 'open':
      print(`${indent}<${data[0]}>`);
      indent += '  ';
      break;
    case 'elide':
      print(`${indent}...`);
      break;
    case 'ignore':
      print(`${indent}[${stringify(data[0]).slice(1, -1)}]`);
      break;
    case 'content':
      print(`${indent}${stringify(data[0])}`);
      break;
    case 'close':
      indent = indent.slice(2);
      print(`${indent}</${data[0]}>`);
      break;
    default:
      throw new Error(`Invalid opcode "${opcode}"`);
  }
};
const debug = false ? doDebug : () => { };

// -----------------------------------------------------------------------------

const coercion = {
  integer: (s) => Number(s),
  real: (s) => Number(s),
  string: (s) => String(s),
  data: (s) => Buffer.from(s, 'base64'),
  date: (s) => new Date(s),
  true: () => true,
  false: () => false,
};

const open = (state, tag) => {
  if (state.ignoring > 0) {
    state.ignoring++;
    return;
  }

  debug('open', tag);
  const { keys, pending, withPlaylists } = state;
  if (!withPlaylists && keys.length === 1 && keys[0] === 'Playlists') {
    debug('elide');
    state.ignoring++;
  }

  let value = '';
  if (tag === 'array') {
    value = [];
  } else if (tag === 'dict') {
    value = create(null);
  }

  pending.push({ tag, value });
};

const content = (state, text) => {
  if (state.ignoring > 0) return;

  const { pending } = state;
  const top = pending[pending.length - 1];
  const { tag } = top;

  if (tag === 'array' || tag === 'dict' || tag === 'plist') {
    debug('ignore', text);
  } else {
    debug('content', text);
    top.value += text;
  }
};

const close = (state, tag) => {
  if (state.ignoring > 0) {
    state.ignoring--;
    if (state.ignoring > 0) return;
  }

  debug('close', tag);

  const { keys, pending } = state;
  let { tag: tag2, value } = pending.pop();
  assert(tag === tag2);

  if (tag === 'plist') {
    assert(pending.length === 0);
    assert(keys.length === 0);
    state.result = value;
    return;
  } else if (tag === 'key') {
    keys.push(value);
    return;
  }

  value = (coercion[tag] ?? identity)(value);
  const top = pending[pending.length - 1];
  const target = top.tag;

  if (target === 'plist') {
    top.value = value;
  } else if (target === 'array') {
    top.value.push(value);
  } else if (target === 'dict') {
    assert(keys.length > 0);
    top.value[keys.pop()] = value;
  } else {
    throw new Error(`Not a container "${target}"`);
  }
};

const parse = (data, { withPlaylists = false } = {}) => {
  const state = { keys: [], pending: [], ignoring: 0, withPlaylists };
  const engine = new expat.Parser('UTF-8')
    .on('startElement', tag => open(state, tag))
    .on('text', text => content(state, text))
    .on('endElement', tag => close(state, tag));

  if (!engine.parse(data, true)) {
    throw engine.getError();
  }
  return state.result;
};

export default parse;
