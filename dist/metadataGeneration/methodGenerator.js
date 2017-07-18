"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsDocUtils_1 = require("./../utils/jsDocUtils");
var exceptions_1 = require("./exceptions");
var metadataGenerator_1 = require("./metadataGenerator");
var parameterGenerator_1 = require("./parameterGenerator");
var resolveImplicitType_1 = require("./resolveImplicitType");
var resolveType_1 = require("./resolveType");
var decoratorUtils_1 = require("./../utils/decoratorUtils");
var statusCodes_1 = require("../utils/statusCodes");
var MethodGenerator = (function () {
    function MethodGenerator(node) {
        this.node = node;
        this.processMethodDecorators();
    }
    MethodGenerator.prototype.IsValid = function () {
        return !!this.method;
    };
    MethodGenerator.prototype.Generate = function () {
        if (!this.IsValid()) {
            throw new exceptions_1.GenerateMetadataError(this.node, 'This isn\'t a valid a controller method.');
        }
        var identifier = this.node.name;
        var type;
        if (this.node.type) {
            type = resolveType_1.ResolveType(this.node.type);
        }
        else {
            var test_1 = metadataGenerator_1.MetadataGenerator.current.typeChecker.getTypeAtLocation(this.node);
            var implicitType = test_1.getCallSignatures()[0].getReturnType();
            type = resolveImplicitType_1.ResolveImplicitType(implicitType);
        }
        var responses = this.getMethodResponses(type);
        return {
            deprecated: jsDocUtils_1.isExistJSDocTag(this.node, function (tag) { return tag.tagName.text === 'deprecated'; }),
            description: jsDocUtils_1.getJSDocDescription(this.node),
            method: this.method,
            name: identifier.text,
            parameters: this.buildParameters(),
            path: this.path,
            produces: this.getProduces(),
            responses: responses,
            security: this.getMethodSecurity(),
            summary: jsDocUtils_1.getJSDocComment(this.node, 'summary'),
            tags: this.getMethodTags(),
            type: type
        };
    };
    MethodGenerator.prototype.buildParameters = function () {
        var _this = this;
        var parameters = this.node.parameters.map(function (p) {
            try {
                return new parameterGenerator_1.ParameterGenerator(p, _this.method, _this.path).Generate();
            }
            catch (e) {
                var methodId = _this.node.name;
                var controllerId = _this.node.parent.name;
                var parameterId = p.name;
                throw new exceptions_1.GenerateMetadataError(_this.node, "Error generate parameter method: '" + controllerId.text + "." + methodId.text + "' argument: " + parameterId.text + " " + e);
            }
        }).filter(function (p) { return p; });
        var bodyParameters = parameters.filter(function (p) { return p.in === 'body'; });
        var bodyProps = parameters.filter(function (p) { return p.in === 'body-prop'; });
        if (bodyParameters.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one body parameter allowed in '" + this.getCurrentLocation() + "' method.");
        }
        if (bodyParameters.length > 0 && bodyProps.length > 0) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Choose either during @Body or @BodyProp in '" + this.getCurrentLocation() + "' method.");
        }
        return parameters;
    };
    MethodGenerator.prototype.getCurrentLocation = function () {
        var methodId = this.node.name;
        var controllerId = this.node.parent.name;
        return controllerId.text + "." + methodId.text;
    };
    MethodGenerator.prototype.processMethodDecorators = function () {
        var pathDecorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.methodActionIdentifiers.indexOf(identifier.text) >= 0; });
        if (!pathDecorators || !pathDecorators.length) {
            return;
        }
        if (pathDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one path decorator in '" + this.getCurrentLocation + "' method, Found: " + pathDecorators.map(function (d) { return d.text; }).join(', '));
        }
        var decorator = pathDecorators[0];
        var expression = decorator.parent;
        var methodAction = metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getMethodAction(expression);
        this.method = methodAction.method;
        // if you don't pass in a path to the method decorator, we'll just use the base route
        // todo: what if someone has multiple no argument methods of the same type in a single controller?
        // we need to throw an error there
        this.path = methodAction.path;
    };
    MethodGenerator.prototype.getMethodResponses = function (type) {
        var decorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.responseIdentifiers.indexOf(identifier.text) >= 0; });
        var responses = decorators.map(function (decorator) {
            var expression = decorator.parent;
            return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getMethodResponse(expression, type);
        });
        var successResponses = responses.filter(function (res) { return res.code < 400; });
        if (!successResponses.length) {
            var code = type.typeName === 'void' ? 204 : 200;
            var successResponse = {
                code: code,
                description: statusCodes_1.getPhase(code),
                name: code.toString(),
                schema: type
            };
            successResponses.push(successResponse);
            responses.push(successResponse);
        }
        if (successResponses.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one SuccessResponse decorator allowed in '" + this.getCurrentLocation + "' method.");
        }
        successResponses[0].examples = this.getMethodSuccessExamples() || successResponses[0].examples;
        return responses;
    };
    MethodGenerator.prototype.getMethodSuccessExamples = function () {
        var exampleDecorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.exampleIdentifiers.indexOf(identifier.text) >= 0; });
        if (!exampleDecorators || !exampleDecorators.length) {
            return undefined;
        }
        if (exampleDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one Example decorator allowed in '" + this.getCurrentLocation + "' method.");
        }
        var decorator = exampleDecorators[0];
        var expression = decorator.parent;
        return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getExample(expression);
    };
    MethodGenerator.prototype.getMethodTags = function () {
        var tagsDecorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.tagIdentifiers.indexOf(identifier.text) >= 0; });
        if (!tagsDecorators || !tagsDecorators.length) {
            return [];
        }
        if (tagsDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one Tags decorator allowed in '" + this.getCurrentLocation + "' method.");
        }
        var decorator = tagsDecorators[0];
        var expression = decorator.parent;
        return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getMethodTags(expression);
    };
    MethodGenerator.prototype.getMethodSecurity = function () {
        var securityDecorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.securityIdentifiers.indexOf(identifier.text) >= 0; });
        if (!securityDecorators || !securityDecorators.length) {
            return undefined;
        }
        if (securityDecorators.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "Only one Security decorator allowed in '" + this.getCurrentLocation + "' method.");
        }
        var decorator = securityDecorators[0];
        var expression = decorator.parent;
        return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getMethodSecurities(expression);
    };
    MethodGenerator.prototype.getProduces = function () {
        var decorators = decoratorUtils_1.getDecorators(this.node, function (identifier) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.produceIdentifiers.indexOf(identifier.text) >= 0; });
        var produces = decorators.map(function (decorator) { return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getProduce(decorator.parent); });
        if (!produces.length) {
            produces.push('application/json');
        }
        return produces;
    };
    return MethodGenerator;
}());
exports.MethodGenerator = MethodGenerator;
//# sourceMappingURL=methodGenerator.js.map