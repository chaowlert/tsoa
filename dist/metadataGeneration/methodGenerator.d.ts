import * as ts from 'typescript';
import { Method } from './types';
export declare class MethodGenerator {
    private readonly node;
    private method;
    private path;
    constructor(node: ts.MethodDeclaration);
    IsValid(): boolean;
    Generate(): Method;
    private buildParameters();
    private getCurrentLocation();
    private processMethodDecorators();
    private getMethodResponses(type);
    private getMethodSuccessExamples();
    private getMethodTags();
    private getMethodSecurity();
    private getProduces();
}
