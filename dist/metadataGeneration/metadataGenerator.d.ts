import * as ts from 'typescript';
import { Metadata, ReferenceType } from './types';
import { DecoratorPlugin } from '../plugins/DecoratorPlugin';
export declare class MetadataGenerator {
    decoratorPlugin: DecoratorPlugin;
    static current: MetadataGenerator;
    readonly nodes: ts.Node[];
    readonly typeChecker: ts.TypeChecker;
    private readonly program;
    private referenceTypes;
    private circularDependencyResolvers;
    IsExportedNode(node: ts.Node): boolean;
    constructor(entryFile: string, compilerOptions?: ts.CompilerOptions, decoratorPlugin?: DecoratorPlugin);
    Generate(): Metadata;
    TypeChecker(): ts.TypeChecker;
    AddReferenceType(referenceType: ReferenceType): void;
    GetReferenceType(typeName: string): ReferenceType;
    OnFinish(callback: (referenceTypes: {
        [typeName: string]: ReferenceType;
    }) => void): void;
    private buildControllers();
}
