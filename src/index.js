import smx from './smx.js';
import SMXLoader from './loader/Loader.js';
import SMXNode from './document/Node.js';
import SMXDocument from './document/Document.js';
import SMXPlayhead from './playhead/Playhead.js';

smx.Loader = SMXLoader;
smx.Document = SMXDocument;
smx.Node = SMXNode;
smx.Playhead = SMXPlayhead;

import MetadataPlugin from './modules/metadata/index.js';
import PrototypePlugin from './modules/prototype/index.js';
import TaxonomyPlugin from './modules/taxonomy/index.js';
import UiPlugin from './modules/ui/index.js';

smx.registerModule(MetadataPlugin);
smx.registerModule(PrototypePlugin);
smx.registerModule(TaxonomyPlugin);
smx.registerModule(UiPlugin);

//expose global
window.smx = smx;