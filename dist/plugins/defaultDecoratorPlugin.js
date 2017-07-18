"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var exceptions_1 = require("../metadataGeneration/exceptions");
var resolveType_1 = require("../metadataGeneration/resolveType");
var decoratorUtils_1 = require("../utils/decoratorUtils");
var statusCodes_1 = require("../utils/statusCodes");
exports.defaultDecoratorPlugin = {
    defaultParameterIdentifier: { name: 'Path', type: 'path' },
    exampleIdentifiers: ['Example'],
    methodActionIdentifiers: ['Get', 'Post', 'Patch', 'Put', 'Delete'],
    parameterIdentifiers: [
        { name: 'Request', type: 'request' },
        { name: 'Body', type: 'body' },
        { name: 'BodyProp', type: 'body-prop' },
        { name: 'Header', type: 'header' },
        { name: 'Query', type: 'query' },
        { name: 'Path', type: 'path' },
    ],
    produceIdentifiers: [],
    responseIdentifiers: ['Response', 'SuccessResponse'],
    routeIdentifiers: ['Route'],
    securityIdentifiers: ['Security'],
    tagIdentifiers: ['Tags'],
    getExample: function (expression) {
        var argument = expression.arguments[0];
        return getExamplesValue(argument);
    },
    getRoutePrefix: function (expression) {
        var value = expression.arguments[0];
        return value ? value.text : '';
    },
    getMethodAction: function (expression) {
        var decoratorArgument = expression.arguments[0];
        var decorator = expression.expression;
        return {
            method: decorator.text.toLowerCase(),
            path: decoratorArgument ? "/" + decoratorArgument.text : ''
        };
    },
    getMethodResponse: function (expression, returnType) {
        var decorator = expression.expression;
        var isSuccessResponse = decorator.text === 'SuccessResponse';
        var code = isSuccessResponse ? (returnType.typeName === 'void' ? 204 : 200) : 400;
        var name = code.toString();
        var description = statusCodes_1.getPhase(code);
        var examples = undefined;
        var schema = isSuccessResponse ? returnType : undefined;
        if (expression.arguments.length > 0 && expression.arguments[0].text) {
            name = expression.arguments[0].text;
        }
        if (expression.arguments.length > 1 && expression.arguments[1].text) {
            description = expression.arguments[1].text;
        }
        if (expression.arguments.length > 2 && expression.arguments[2].text) {
            var argument = expression.arguments[2];
            examples = getExamplesValue(argument);
        }
        if (!isSuccessResponse && expression.typeArguments && expression.typeArguments.length > 0) {
            schema = resolveType_1.ResolveType(expression.typeArguments[0]);
        }
        return {
            code: code,
            description: description,
            examples: examples,
            name: name,
            schema: schema,
        };
    },
    getMethodSecurities: function (expression) {
        return {
            name: expression.arguments[0].text,
            scopes: expression.arguments[1] ? expression.arguments[1].elements.map(function (e) { return e.text; }) : undefined
        };
    },
    getMethodTags: function (expression) {
        return expression.arguments.map(function (a) { return a.text; });
    },
    getProduce: function (expression) {
        throw new exceptions_1.GenerateMetadataError(expression, 'Produce is not supported.');
    },
};
function getExamplesValue(argument) {
    var example = {};
    argument.properties.forEach(function (p) {
        example[p.name.text] = decoratorUtils_1.getInitializerValue(p.initializer);
    });
    return example;
}
//# sourceMappingURL=defaultDecoratorPlugin.js.map