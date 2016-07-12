import MDXObject from './worldObject.js';

const fHairGeoset = [1, 3, 2];

const UNIT_MAINHAND_SLOT = 1;
const UNIT_OFFHAND_SLOT  = 2;
const UNIT_RANGED_SLOT   = 3;

const virtualItemMap = [1, 2, 1];

function extractFilePath(filePath) {
    for (var i = filePath.length-1; i >0; i-- ) {
        if (filePath[i] == '\\' || filePath[i] == '/') {
            return filePath.substr(0, i+1);
        }
    }

    return '';
}



function findSectionRec(csd, race, gender, section, type, color) {
    for (var i = 0; i < csd.length; i++) {
        if (csd[i].race == race &&
            csd[i].gender == gender &&
            csd[i].section == section &&
            csd[i].type == type &&
            csd[i].color == color
        ) {
            return csd[i];
        }
    }
    return null;
}
function findHairGeosetRec(chgd, race, gender, type ) {
    for (var i = 0; i < chgd.length; i++) {
        if (chgd[i].race == race &&
            chgd[i].gender == gender &&
            chgd[i].hairStyle == type
        ) {
            return chgd[i];
        }
    }
    return null;
}

function findFaceHairStyleRec(cfhsd, race, gender, type ) {
    for (var i = 0; i < cfhsd.length; i++) {
        if (cfhsd[i].race == race &&
            cfhsd[i].gender == gender &&
            cfhsd[i].hairStyle == type
        ) {
            return cfhsd[i];
        }
    }
    return null;
}

class WorldUnit {
    constructor(sceneApi){
        this.sceneApi = sceneApi;

        this.objectModel = null;
        this.mountModel = null;
        this.items = new Array(3);
    }

    createModelFromDisplayId(value){
        var csd = this.sceneApi.dbc.getCharSectionsDBC();
        var chgd = this.sceneApi.dbc.getCharHairGeosetsDBC();
        var cfhsd = this.sceneApi.dbc.getCharacterFacialHairStylesDBC();

        var cdid = this.sceneApi.dbc.getCreatureDisplayInfoDBC();
        var cdied = this.sceneApi.dbc.getCreatureDisplayInfoExtraDBC();
        var cmdd = this.sceneApi.dbc.getCreatureModelDataDBC();
        var idid = this.sceneApi.dbc.getItemDisplayInfoDBC();

        var displayInf = cdid[value];
        var displayIDScale = displayInf.modelScale;
        this.displayIDScale = displayIDScale;

        var modelFilename = cmdd[displayInf.model1].modelName;
        var modelScale = cmdd[displayInf.model1].modelScale;
        this.modelScale = modelScale;

        var replaceTextures = [];
        if (displayInf.skin1 != '')
            replaceTextures[11] = extractFilePath(modelFilename)+displayInf.skin1+'.blp';

        if (displayInf.skin2 != '')
            replaceTextures[12] = extractFilePath(modelFilename)+displayInf.skin2+'.blp';

        if (displayInf.skin3 != '')
            replaceTextures[13] = extractFilePath(modelFilename)+displayInf.skin3+'.blp';

        var meshIds = [];
        for (var i = 0; i < 19; i++)
            meshIds[i] = 1;

        meshIds[7] = -1;

        if (displayInf.displayExtra > 0) {
            var displayExtraInfo = cdied[displayInf.displayExtra];

            replaceTextures[1] = 'Textures\\BakedNpcTextures\\'+displayExtraInfo.skinTexture;

            //Hair
            var charSect = findSectionRec(csd, displayExtraInfo.race,displayExtraInfo.gender, 3,
                displayExtraInfo.hairType, displayExtraInfo.hairStyle);
            if (charSect != null)
                replaceTextures[6] = charSect.texture1;

            var charHair = findHairGeosetRec(chgd, displayExtraInfo.race, displayExtraInfo.gender, displayExtraInfo.hairType);
            if ((charHair != null) && (charHair.geoset != 0))
                meshIds[0] = charHair.geoset;

            //FaceHair
            var charSect = findSectionRec(csd, displayExtraInfo.race,displayExtraInfo.gender, 2,displayExtraInfo.faceHairStyle,displayExtraInfo.hairStyle);
            if (charSect != null) {
                replaceTextures[8] = charSect.texture1;
            }
            var charFHStyle = findFaceHairStyleRec(cfhsd, displayExtraInfo.race,
                displayExtraInfo.gender, displayExtraInfo.faceHairStyle);
            if (charFHStyle != null) {
                for (var i = 0; i < 3; i++)
                    if (charFHStyle.geoset[i] != 0)
                        meshIds[fHairGeoset[i]] = charFHStyle.geoset[i];
            }



            /* Items */
            var ItemDInfo = idid[displayExtraInfo.helmItem];
            if (ItemDInfo) {

            }
            ItemDInfo = idid[displayExtraInfo.shoulderItem];
            if (ItemDInfo) {

            }
            ItemDInfo = idid[displayExtraInfo.shirtItem];
            if (ItemDInfo){

            }
            ItemDInfo = idid[displayExtraInfo.cuirassItem];
            if (ItemDInfo) {
                meshIds[8] = 1 + ItemDInfo.geosetGroup_1;
            }

            ItemDInfo = idid[displayExtraInfo.beltItem];
            if (ItemDInfo) {
                meshIds[18] = 1 + ItemDInfo.geosetGroup_3;
            }
            ItemDInfo = idid[displayExtraInfo.legsItem];
            if (ItemDInfo) {
                if (meshIds[8] > 1)
                    meshIds[13] = 1 + ItemDInfo.geosetGroup_3;
            }
            ItemDInfo = idid[displayExtraInfo.bootsItem];
            if (ItemDInfo) {
                meshIds[5] = 1 + ItemDInfo.geosetGroup_1;
            }
            ItemDInfo = idid[displayExtraInfo.ringsItem];
            if (ItemDInfo){

            }
            ItemDInfo = idid[displayExtraInfo.glovesItem];
            if (ItemDInfo) {
                meshIds[4] = 1 + ItemDInfo.geosetGroup_1;
            }
            ItemDInfo = idid[displayExtraInfo.tabardItem];
            if (ItemDInfo) {
                if (meshIds[8] == 1)
                    meshIds[12] = 1 + ItemDInfo.geosetGroup_1;
            }
            ItemDInfo = idid[displayExtraInfo.capeItem];
            if (ItemDInfo) {
                replaceTextures[2] ='Item\\ObjectComponents\\Cape\\'+ ItemDInfo.leftTextureModel + '.BLP';
                meshIds[15] = 1 + ItemDInfo.geosetGroup_1;
            }
        }//DisplayExtra


        var model = this.sceneApi.objects.loadWorldM2Obj(modelFilename,meshIds,replaceTextures);
        return model;
    }

    setPosition(pos) {
        this.pos = pos;
    }
    setRotation(f) {
        this.f = f;
    }
    setScale(scale) {
        this.scale = scale;
    }

    update (deltaTime, cameraPos) {
        /* 1. Calculate current position */

        /* 2. Update position for all models */
        var properScale = this.displayIDScale;
        if (this.scale > 0.0001) {
            properScale = this.displayIDScale * this.scale;
        }

        if (this.mountModel && this.mountModel.m2Geom != null && this.mountModel.m2Geom.m2File != null) {
            /* Update placement matrix */
            this.mountModel.createPlacementMatrix(this.pos, this.f, properScale);

            /* Update bone matrices */
            this.mountModel.objectUpdate(deltaTime, cameraPos);

            /* Update main model */
            this.objectModel.createPlacementMatrixFromParent(this.mountModel, 0, this.modelScale * this.displayIDScale);
        } else {
            this.objectModel.createPlacementMatrix(this.pos, this.f, properScale);
        }
        /* Update bone matrices */
        this.objectModel.objectUpdate(deltaTime, cameraPos);

        //3. Update placement matrices for items
        for (var i = 0; i < this.items.length; i++) {
             if (this.items[i]) {
                 this.items[i].createPlacementMatrixFromParent(this.objectModel, virtualItemMap[i], this.modelScale * this.displayIDScale);
                 this.items[i].objectUpdate(deltaTime, cameraPos);
             }
        }
    }

    setVirtualItemSlot(slot, displayId) {
        var idid = this.sceneApi.getItemDisplayInfoDBC();

        /* 1. Free previous model */

        /* 2. Configure new model */
        var ItemDInfo = idid[displayId];
        if (ItemDInfo) {
            var modelName;
            if (slot == UNIT_MAINHAND_SLOT || UNIT_MAINHAND_SLOT == UNIT_RANGED_SLOT) {
                modelName = ItemDInfo.leftModel
            } else {
                modelName = ItemDInfo.rightModel
            }

            var model = this.sceneApi.loadWorldM2Obj(modelName);
            model.makeTextureArray(null, null);

            this.items[slot] = model;
        }
    }

    setMountDisplayId(value) {
        var model = this.createModelFromDisplayId(value);

        this.mountModel = model;
    }
    setDisplayId( value ) {
        var model = this.createModelFromDisplayId(value);

        this.objectModel = model;
    }
    setEntry ( value ) {
        this.entry = value;

        //1. Get displayId from entry


        //2. Set displayId
        this.setDisplayId(0)
    }
}

export default WorldUnit;