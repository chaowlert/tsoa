"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var exceptions_1 = require("./exceptions");
var metadataGenerator_1 = require("./metadataGenerator");
var methodGenerator_1 = require("./methodGenerator");
var ControllerGenerator = (function () {
    function ControllerGenerator(node) {
        this.node = node;
        this.pathValue = this.getControllerRouteValue(node);
    }
    ControllerGenerator.prototype.IsValid = function () {
        return !!this.pathValue || this.pathValue === '';
    };
    ControllerGenerator.prototype.Generate = function () {
        if (!this.node.parent) {
            throw new exceptions_1.GenerateMetadataError(this.node, 'Controller node doesn\'t have a valid parent source file.');
        }
        if (!this.node.name) {
            throw new exceptions_1.GenerateMetadataError(this.node, 'Controller node doesn\'t have a valid name.');
        }
        var sourceFile = this.node.parent.getSourceFile();
        return {
            location: sourceFile.fileName,
            methods: this.buildMethods(),
            name: this.node.name.text,
            path: this.pathValue || ''
        };
    };
    ControllerGenerator.prototype.buildMethods = function () {
        return this.node.members
            .filter(function (m) { return m.kind === ts.SyntaxKind.MethodDeclaration; })
            .map(function (m) { return new methodGenerator_1.MethodGenerator(m); })
            .filter(function (generator) { return generator.IsValid(); })
            .map(function (generator) { return generator.Generate(); });
    };
    ControllerGenerator.prototype.getControllerRouteValue = function (node) {
        return this.getControllerDecoratorValue(node);
    };
    ControllerGenerator.prototype.getControllerDecoratorValue = function (node) {
        if (!node.decorators) {
            return undefined;
        }
        var matchedAttributes = node.decorators
            .map(function (d) { return d.expression; })
            .filter(function (expression) {
            var subExpression = expression.expression;
            return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.routeIdentifiers.indexOf(subExpression.text) >= 0;
        });
        if (!matchedAttributes.length) {
            return undefined;
        }
        if (matchedAttributes.length > 1) {
            throw new exceptions_1.GenerateMetadataError(this.node, "A controller can only have a single 'decoratorName' decorator in `" + this.node.name.text + "` class.");
        }
        return metadataGenerator_1.MetadataGenerator.current.decoratorPlugin.getRoutePrefix(matchedAttributes[0]);
    };
    return ControllerGenerator;
}());
exports.ControllerGenerator = ControllerGenerator;
//# sourceMappingURL=controllerGenerator.js.map