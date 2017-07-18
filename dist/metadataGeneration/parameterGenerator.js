"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var exceptions_1 = require("./exceptions");
var metadataGenerator_1 = require("./metadataGenerator");
var resolveType_1 = require("./resolveType");
var decoratorUtils_1 = require("./../utils/decoratorUtils");
var decoratorUtils_2 = require("../utils/decoratorUtils");
var validatorUtils_1 = require("./../utils/validatorUtils");
var ParameterGenerator = (function () {
    function ParameterGenerator(parameter, method, path) {
        this.parameter = parameter;
        this.method = method;
        this.path = path;
    }
    ParameterGenerator.prototype.Generate = function () {
        var decorators = decoratorUtils_2.getDecorators(this.parameter, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.parameterIdentifiers.some(function (id) { return id.name === identifier.text; }); });
        if (!decorators.length && !metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.defaultParameterIdentifier) {
            return null;
        }
        var decorator = decorators[0];
        var paramIdentifier = decorator
            ? metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.parameterIdentifiers.find(function (id) { return id.name === decorator.text; })
            : metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.defaultParameterIdentifier;
        switch (paramIdentifier.type) {
            case 'request':
                return this.getRequestParameter(this.parameter);
            case 'body':
                return this.getBodyParameter(this.parameter);
            case 'body-prop':
                return this.getBodyPropParameter(this.parameter);
            case 'header':
                return this.getHeaderParameter(this.parameter);
            case 'query':
                return this.getQueryParameter(this.parameter);
            case 'path':
                return this.getPathParameter(this.parameter);
            default:
                throw new exceptions_1.GenerateMetadataError(this.parameter, "Type '" + paramIdentifier.type + "' is not supported in '" + this.getCurrentLocation() + "' method.");
        }
    };
    ParameterGenerator.prototype.getCurrentLocation = function () {
        var methodId = this.parameter.parent.name;
        var controllerId = this.parameter.parent.parent.name;
        return controllerId.text + "." + methodId.text;
    };
    ParameterGenerator.prototype.getRequestParameter = function (parameter) {
        var parameterName = parameter.name.text;
        return {
            description: this.getParameterDescription(parameter),
            in: 'request',
            name: parameterName,
            required: !parameter.questionToken,
            type: { typeName: 'object' },
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getBodyPropParameter = function (parameter) {
        var parameterName = parameter.name.text;
        var type = this.getValidatedType(parameter);
        if (!this.supportBodyMethod(this.method)) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Body can't support '" + this.getCurrentLocation() + "' method.");
        }
        return {
            description: this.getParameterDescription(parameter),
            in: 'body-prop',
            name: decoratorUtils_1.getDecoratorTextValue(this.parameter, function (ident) { return ident.text === 'BodyProp'; }) || parameterName,
            required: !parameter.questionToken,
            type: type,
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getBodyParameter = function (parameter) {
        var parameterName = parameter.name.text;
        var type = this.getValidatedType(parameter);
        if (!this.supportBodyMethod(this.method)) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Body can't support " + this.method + " method");
        }
        return {
            description: this.getParameterDescription(parameter),
            in: 'body',
            name: parameterName,
            required: !parameter.questionToken,
            type: type,
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getHeaderParameter = function (parameter) {
        var parameterName = parameter.name.text;
        var type = this.getValidatedType(parameter);
        if (!this.supportPathDataType(type)) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Parameter '" + parameterName + "' can't be passed as a header parameter in '" + this.getCurrentLocation() + "'.");
        }
        return {
            description: this.getParameterDescription(parameter),
            in: 'header',
            name: decoratorUtils_1.getDecoratorTextValue(this.parameter, function (ident) { return ident.text === 'Header'; }) || parameterName,
            required: !parameter.questionToken,
            type: type,
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getQueryParameter = function (parameter) {
        var parameterName = parameter.name.text;
        var type = this.getValidatedType(parameter);
        if (!this.supportPathDataType(type)) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Parameter '" + parameterName + "' can't be passed as a query parameter in '" + this.getCurrentLocation() + "'.");
        }
        return {
            description: this.getParameterDescription(parameter),
            in: 'query',
            name: decoratorUtils_1.getDecoratorTextValue(this.parameter, function (ident) { return ident.text === 'Query'; }) || parameterName,
            required: !parameter.questionToken,
            type: type,
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getPathParameter = function (parameter) {
        var parameterName = parameter.name.text;
        var type = this.getValidatedType(parameter);
        var pathName = decoratorUtils_1.getDecoratorTextValue(this.parameter, function (ident) { return ident.text === 'Path'; }) || parameterName;
        if (!this.supportPathDataType(type)) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Parameter '" + parameterName + ":" + type + "' can't be passed as a path parameter in '" + this.getCurrentLocation() + "'.");
        }
        if (!this.path.includes("{" + pathName + "}")) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Parameter '" + parameterName + "' can't match in path: '" + this.path + "'");
        }
        return {
            description: this.getParameterDescription(parameter),
            in: 'path',
            name: pathName,
            required: true,
            type: type,
            parameterName: parameterName,
            validators: validatorUtils_1.getParameterValidators(this.parameter, parameterName),
        };
    };
    ParameterGenerator.prototype.getParameterDescription = function (node) {
        var symbol = metadataGenerator_1.MetadataGenerator.current.typeChecker.getSymbolAtLocation(node.name);
        if (!symbol) {
            return undefined;
        }
        var comments = symbol.getDocumentationComment();
        if (comments.length) {
            return ts.displayPartsToString(comments);
        }
        return undefined;
    };
    ParameterGenerator.prototype.supportBodyMethod = function (method) {
        return ['post', 'put', 'patch'].some(function (m) { return m === method.toLowerCase(); });
    };
    ParameterGenerator.prototype.supportPathDataType = function (parameterType) {
        return ['string', 'integer', 'long', 'float', 'double', 'date', 'datetime', 'buffer', 'boolean', 'enum'].find(function (t) { return t === parameterType.typeName; });
    };
    ParameterGenerator.prototype.getValidatedType = function (parameter) {
        if (!parameter.type) {
            throw new exceptions_1.GenerateMetadataError(parameter, "Parameter " + parameter.name + " doesn't have a valid type assigned in '" + this.getCurrentLocation() + "'.");
        }
        return resolveType_1.ResolveType(parameter.type);
    };
    return ParameterGenerator;
}());
exports.ParameterGenerator = ParameterGenerator;
//# sourceMappingURL=parameterGenerator.js.map