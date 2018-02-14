import smx from './smx.js';
import SMXLoader from './loader/Loader.js';
import SMXNode from './document/Node.js';
import SMXDocument from './document/Document.js';
import SMXPlayhead from './playhead/Playhead.js';

smx.Loader = SMXLoader;
smx.Document = SMXDocument;
smx.Node = SMXNode;
smx.Playhead = SMXPlayhead;

import MetadataPlugin from './plugins/metadata/index.js';
import PrototypePlugin from './plugins/prototype/index.js';
import TaxonomyPlugin from './plugins/taxonomy/index.js';
import UiPlugin from './plugins/ui/index.js';

MetadataPlugin.register(smx);
PrototypePlugin.register(smx);
TaxonomyPlugin.register(smx);
UiPlugin.register(smx);

window.smx = smx;