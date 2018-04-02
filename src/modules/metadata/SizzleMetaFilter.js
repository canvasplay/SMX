var SizzleMetaFilter = function(elem, i, match){
    var preffix = 'meta-';
    var regex = new RegExp('\\s*'+preffix+'\\w*="', 'ig');
    var attrs = elem.attributes;
    var str = [];
    str.push('<'+elem.nodeName);
    for(var a=0;a<attrs.length;a++){
        str.push(attrs[a].nodeName+'="'+attrs[a].nodeValue+'"');
    }
    str.push('>');
    str = str.join(' ');

    return regex.test(str);
};

export default SizzleMetaFilter;