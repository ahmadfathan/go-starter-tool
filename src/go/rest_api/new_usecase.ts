import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import { snakeToPascal } from '../../utils';

export async function createNewUseCase() {
    try {
        // Determine target path
        let targetPath: string;

        if (vscode.workspace.workspaceFolders?.length) {
            targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('currently no open folders, please open the project folder first');
        }

        // Ask usecase name
        const usecaseName = await vscode.window.showInputBox({
            prompt: 'Enter usecase name',
            placeHolder: 'get_outlet_list',
            validateInput: (value) => {
                if (!value?.trim()) return 'Usecase name cannot be empty';
                if (value.includes('/') || value.includes('\\') ||  value.includes(' ')) {
                    return 'Usecase name cannot contain slashes or whitespaces';
                }
                return null;
            }
        });

        if (!usecaseName) return;

        const usecasePath = path.join(
            targetPath,
            'internal',
            'usecase',
        );

        // Normalize usecase name (Go-style exported struct)
        const usecaseNamePascalCase = snakeToPascal(usecaseName);
        const usecaseStructName = usecaseNamePascalCase + 'UseCase';

        const usecaseFilePath = path.join(
            usecasePath,
            `${usecaseName}.go`
        );

        // Ensure usecase directory exists
        await fse.ensureDir(usecasePath);

        /*
            1. Create {{usecaseName}}.go
        */
        if (await fse.pathExists(usecaseFilePath)) {
            throw new Error(`${usecaseName}.go already exists`);
        }

        const usecaseFileContent = 
`
package usecase

import (
	"context"
)

type ${usecaseStructName}Input struct {
	// add more input here
}

type ${usecaseStructName}Output struct {
	// add more output here
}

type ${usecaseStructName} struct {
}

func New${usecaseStructName}() *${usecaseStructName} {
	return &${usecaseStructName}{}
}

func (uc *${usecaseStructName}) Execute(
	ctx context.Context,
	in ${usecaseStructName}Input,
) (${usecaseStructName}Output, error) {
	var (
		out ${usecaseStructName}Output
	)

	// implement usecase

	return out, nil
}
`;

        await fse.writeFile(usecaseFilePath, usecaseFileContent);

        vscode.window.showInformationMessage(
            `✅ Usecase "${usecaseName}" created successfully`
        );

    } catch (err: any) {
        vscode.window.showErrorMessage(
            `❌ Failed to create usecase: ${err.message}`
        );
    }

}