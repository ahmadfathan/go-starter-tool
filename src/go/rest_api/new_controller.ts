import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import { snakeToPascal } from '../../utils';

export async function createNewController() {
    try {
        // Determine target path
        let targetPath: string;

        if (vscode.workspace.workspaceFolders?.length) {
            targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('currently no open folders, please open the project folder first');
        }

        // Ask controller name
        const controllerName = await vscode.window.showInputBox({
            prompt: 'Enter controller name',
            placeHolder: 'outlet',
            validateInput: (value) => {
                if (!value?.trim()) return 'Controller name cannot be empty';
                if (value.includes('/') || value.includes('\\')) {
                    return 'Controller name cannot contain slashes';
                }
                return null;
            }
        });

        if (!controllerName) return;

        const controllerPath = path.join(
            targetPath,
            'internal',
            'transport',
            'http',
            'controller',
        );

        // Normalize controller name (Go-style exported struct)
        const controllerNamePascalCase = snakeToPascal(controllerName);
        const controllerStructName = controllerNamePascalCase + 'Controller';

        const typesFilePath = path.join(controllerPath, 'types.go');
        const controllerFilePath = path.join(
            controllerPath,
            `${controllerName}.go`
        );

        // Ensure controller directory exists
        await fse.ensureDir(controllerPath);

        /*
            1. Append to types.go
            type {{ControllerName}}Controller struct {}
        */
        if (!(await fse.pathExists(typesFilePath))) {
            throw new Error('types.go not found in controller directory');
        }

        const typesContent = await fse.readFile(typesFilePath, 'utf8');

        const controllerStruct = 
`
// ${controllerStructName} handles ${controllerName} related HTTP requests
type ${controllerStructName} struct {}

func New${controllerStructName}() *${controllerStructName} {
	return &${controllerStructName}{}
}
`;

        if (!typesContent.includes(`type ${controllerStructName} struct`)) {
            await fse.appendFile(typesFilePath, controllerStruct);
        } else {
            vscode.window.showWarningMessage(
                `Controller ${controllerStructName} already exists in types.go`
            );
        }

        /*
            2. Create {{controllerName}}.go
        */
        if (await fse.pathExists(controllerFilePath)) {
            throw new Error(`${controllerName}.go already exists`);
        }

        const controllerFileContent = 
`
package controller

import "github.com/gin-gonic/gin"

func (c *${controllerStructName}) Create${controllerNamePascalCase}(ctx *gin.Context) {
    // implement create
}

func (c *${controllerStructName}) Get${controllerNamePascalCase}(ctx *gin.Context) {
    // implement get
}

func (c *${controllerStructName}) Get${controllerNamePascalCase}List(ctx *gin.Context) {
    // implement list
}

func (c *${controllerStructName}) Update${controllerNamePascalCase}(ctx *gin.Context) {
    // implement update
}

func (c *${controllerStructName}) Delete${controllerNamePascalCase}(ctx *gin.Context) {
    // implement delete
}
`;

        await fse.writeFile(controllerFilePath, controllerFileContent);

        vscode.window.showInformationMessage(
            `✅ Controller "${controllerName}" created successfully`
        );

    } catch (err: any) {
        vscode.window.showErrorMessage(
            `❌ Failed to create controller: ${err.message}`
        );
    }

}