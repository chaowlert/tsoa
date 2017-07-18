"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ResolveImplicitType(type) {
    if (!type.symbol) {
        return { typeName: 'object' };
    }
    var name = type.intrinsicName;
    if (!name || name === 'unknown') {
        name = type.symbol.name;
    }
    switch (name) {
        case 'number':
            return { typeName: 'double' };
        case 'string':
        case 'boolean':
        case 'void':
        case 'Array':
        case 'Buffer':
            return { typeName: type.symbol.name.toLowerCase() };
        case 'Date':
            return { typeName: 'datetime' };
        case 'Promise':
            return ResolveImplicitType(type.typeArguments[0]);
        default:
            return { typeName: 'object' };
    }
}
exports.ResolveImplicitType = ResolveImplicitType;
//# sourceMappingURL=resolveImplicitType.js.map