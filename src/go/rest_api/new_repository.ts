import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import { pascalToCamel, pascalToSnakeSmart, snakeToPascal } from '../../utils';

export async function createNewRepository() {
    try {
        // Determine target path
        let targetPath: string;

        if (vscode.workspace.workspaceFolders?.length) {
            targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('currently no open folders, please open the project folder first');
        }

        // Ask repository name
        const repositoryName = await vscode.window.showInputBox({
            prompt: 'Enter repository name (PascalCase)',
            placeHolder: 'OutletProduct',
            validateInput: (value) => {
                if (!value?.trim()) return 'Repository name cannot be empty';
                if (value.includes('/') || value.includes('\\') ||  value.includes(' ')) {
                    return 'Repository name cannot contain slashes or whitespaces';
                }
                return null;
            }
        });

        if (!repositoryName) return;

        const domainRepositoryPath = path.join(
            targetPath,
            'internal',
            'domain',
            'repository'
        );

        const infraRepositoryPath = path.join(
            targetPath,
            'internal',
            'infrastructure',
            'repository'
        );

        // Normalize usecase name (Go-style exported struct)
        const repoStructName = repositoryName; // repositoryName already PascalCase

        const repoFileName = `${pascalToSnakeSmart(repositoryName)}.go`;

        const domainRepositoryFilePath = path.join(
            domainRepositoryPath,
            repoFileName
        );
        
        const infraRepositoryFilePath = path.join(
            infraRepositoryPath,
            repoFileName
        );

        // Ensure repository directory exists
        await fse.ensureDir(domainRepositoryPath);
        await fse.ensureDir(infraRepositoryPath);

        /*
            1. Create domain/repository/{{repositoryName}}.go
        */
        if (await fse.pathExists(domainRepositoryFilePath)) {
            throw new Error(`${repositoryName}.go already exists`);
        }

        const domainRepositoryFileContent = 
`
package repository

type ${repoStructName} interface {}
`;

        await fse.writeFile(domainRepositoryFilePath, domainRepositoryFileContent);

         /*
            2. Create infrastructure/repository/{{repositoryName}}.go
        */
        if (await fse.pathExists(infraRepositoryFilePath)) {
            throw new Error(`${repositoryName}.go already exists`);
        }

        const infraRepositoryFileContent = 
`
package repository

type ${repoStructName} struct {}

func New${repoStructName}Repository() *${repoStructName} {
	return &${repoStructName}{}
}
`;

        await fse.writeFile(infraRepositoryFilePath, infraRepositoryFileContent);

        vscode.window.showInformationMessage(
            `✅ Repository "${repositoryName}" created successfully`
        );

    } catch (err: any) {
        vscode.window.showErrorMessage(
            `❌ Failed to create usecase: ${err.message}`
        );
    }

}