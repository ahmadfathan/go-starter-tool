import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import { walkAndReplace } from '../../utils';

export async function createNewProject(extensionPath: string) {
    try {
        // Ask app name
        const appName = await vscode.window.showInputBox({
            prompt: 'Enter app name',
            placeHolder: 'my-go-app',
            validateInput: (value) => {
                if (!value?.trim()) return 'App name cannot be empty';
                if (value.includes('/') || value.includes('\\')) {
                    return 'App name cannot contain slashes';
                }
                return null;
            }
        });

        if (!appName) return;

        // Ask module name
        const moduleName = await vscode.window.showInputBox({
            prompt: 'Enter module name',
            placeHolder: 'github.com/yourname/my-go-app',
            validateInput: (value) => {
                if (!value?.trim()) return 'Module name cannot be empty';
                return null;
            }
        });

        if (!moduleName) return;

        // Determine target path
        let targetPath: string;

        if (vscode.workspace.workspaceFolders?.length) {
            targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            const folder = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: "Generate into this folder"
            });

            if (!folder?.length) return;
            targetPath = folder[0].fsPath;
        }

        const projectPath = path.join(targetPath, appName);

        // Create folder
        if (fs.existsSync(projectPath)) {
            vscode.window.showErrorMessage(
                `Folder "${appName}" already exists`
            );
            return;
        }

        await fse.mkdirp(projectPath);

        // Copy template
        const templatePath = path.join(
            extensionPath,
            'templates',
            'go-rest-api-app'
        );

        if (!fs.existsSync(templatePath)) {
            vscode.window.showErrorMessage('Template folder not found');
            return;
        }

        await fse.copy(templatePath, projectPath);

        // Template variables
        const templateVars = {
            app_name: appName,
            module_name: moduleName,
            port: '8080'
        };

        // Replace placeholders
        await walkAndReplace(projectPath, templateVars);

        vscode.window.showInformationMessage(
            `✅ Project "${appName}" created successfully`
        );

        // ✅ Open project in CURRENT window
        await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(projectPath),
            { forceNewWindow: false }
        );

    } catch (err: any) {
        vscode.window.showErrorMessage(
            `❌ Failed to create project: ${err.message}`
        );
    }

}