import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as fs from 'fs';
import { pascalToCamel, pascalToSnakeSmart, snakeToCamel, snakeToPascal } from '../../utils';

export async function createNewDAO() {
    try {
        // Determine target path
        let targetPath: string;

        if (vscode.workspace.workspaceFolders?.length) {
            targetPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('currently no open folders, please open the project folder first');
        }

        // Ask model name
        const modelName = await vscode.window.showInputBox({
            prompt: 'Enter model name (PascalCase)',
            placeHolder: 'OutletProduct',
            validateInput: (value) => {
                if (!value?.trim()) return 'Model name cannot be empty';
                if (value.includes('/') || value.includes('\\') ||  value.includes(' ')) {
                    return 'Model name cannot contain slashes or whitespaces';
                }
                return null;
            }
        });

        if (!modelName) return;

        const daoPath = path.join(
            targetPath,
            'internal',
            'infrastructure',
            'db',
            'dao'
        );

        // Normalize dao name (Go-style exported struct)
        const modelStructName = modelName; // model name already in PascalCase
        const daoStructName = modelStructName; // same naming as model struct

        const modelStructValueName = pascalToCamel(modelName);

        const daoFileName = `${pascalToSnakeSmart(modelName)}.go`

        const daoFilePath = path.join(
            daoPath,
            daoFileName
        );

        // Ensure usecase directory exists
        await fse.ensureDir(daoPath);

        /*
            1. Create {{modelName}}.go
        */
        if (await fse.pathExists(daoFilePath)) {
            throw new Error(`${modelName}.go already exists`);
        }

        // read module name from go.mod
        const goModFilePath = path.join(
            targetPath,
            'go.mod'
        );

        // read file
        const goModContent = fs.readFileSync(goModFilePath, 'utf8');

        // match: module github.com/user/repo
        const moduleMatch = goModContent.match(/^\s*module\s+([^\s]+)\s*$/m);

        if (!moduleMatch) {
            throw new Error('Could not find module name in go.mod');
        }

        const moduleName = moduleMatch[1];


        const daoFileContent = 
`
package dao

import (
	"context"

	"${moduleName}/internal/infrastructure/db/model"
	"gorm.io/gorm"
)

type ${daoStructName} struct {
	db *gorm.DB
}

func New${daoStructName}DAO(db *gorm.DB) *${daoStructName} {
	return &${daoStructName}{
		db: db,
	}
}

func (dao *${daoStructName}) Create(ctx context.Context, ${modelStructValueName} *model.${modelStructName}) error {
	return dao.db.WithContext(ctx).Create(${modelStructValueName}).Error
}

func (dao *${daoStructName}) List(ctx context.Context) ([]model.${modelStructName}, error) {
	var ${modelStructValueName}List []model.${modelStructName}

	if err := dao.db.WithContext(ctx).Find(&${modelStructValueName}List).Error; err != nil {
		return nil, err
	}

	return ${modelStructValueName}List, nil
}

func (dao *${daoStructName}) FindByID(ctx context.Context, ID string) (model.${modelStructName}, error) {
	var ${modelStructValueName} model.${modelStructName}

	if err := dao.db.WithContext(ctx).Where("id = ?", ID).First(&${modelStructValueName}).Error; err != nil {
		return ${modelStructValueName}, err
	}

	return ${modelStructValueName}, nil
}

func (dao *${daoStructName}) Update(ctx context.Context, ID string, updated${modelStructName} *model.${modelStructName}) error {
	return dao.db.WithContext(ctx).Model(&model.${modelStructName}{}).Where("id = ?", ID).Updates(updated${modelStructName}).Error
}
`;

        await fse.writeFile(daoFilePath, daoFileContent);

        vscode.window.showInformationMessage(
            `✅ DAO "${modelName}" created successfully`
        );

    } catch (err: any) {
        vscode.window.showErrorMessage(
            `❌ Failed to create DAO: ${err.message}`
        );
    }
}



/*
package dao

import (
	"context"

	"github.com/ibncorp/benefit/internal/infrastructure/db/model"
	"gorm.io/gorm"
)

type WiFiAccessPointDAO struct {
	db *gorm.DB
}

func NewWiFiAccessPointDAO(db *gorm.DB) *WiFiAccessPointDAO {
	return &WiFiAccessPointDAO{
		db: db,
	}
}

func (dao *WiFiAccessPointDAO) Create(ctx context.Context, wifiAccessPoint *model.WiFiAccessPoint) error {
	return dao.db.WithContext(ctx).Create(wifiAccessPoint).Error
}

func (dao *WiFiAccessPointDAO) List(ctx context.Context) ([]model.WiFiAccessPoint, error) {
	var wifiAccessPoints []model.WiFiAccessPoint

	if err := dao.db.WithContext(ctx).Find(&wifiAccessPoints).Error; err != nil {
		return nil, err
	}

	return wifiAccessPoints, nil
}

func (dao *WiFiAccessPointDAO) FindByID(ctx context.Context, ID string) (model.WiFiAccessPoint, error) {
	var wifiAccessPoint model.WiFiAccessPoint

	if err := dao.db.WithContext(ctx).Where("id = ?", ID).First(&wifiAccessPoint).Error; err != nil {
		return wifiAccessPoint, err
	}

	return wifiAccessPoint, nil
}

func (dao *WiFiAccessPointDAO) Update(ctx context.Context, ID string, updatedWiFiAccessPoint *model.WiFiAccessPoint) error {
	return dao.db.WithContext(ctx).Model(&model.WiFiAccessPoint{}).Where("id = ?", ID).Updates(updatedWiFiAccessPoint).Error
}

*/