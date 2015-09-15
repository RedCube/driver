/**
 * Copyright (C) 2015 RedCube (BSD3 License)
 * @authors https://github.com/redcube/api/graphs/contributors
 * @url https://redcube.io
 */

var Datamart = require('./datamart.js');


/**
 * Constructor
 */
var DataWarehouse = function(driver, name) {
};

DataWarehouse.prototype.ready = function() {
};

DataWarehouse.prototype.refresh = function() {
};

DataWarehouse.prototype.create = function() {
};

DataWarehouse.prototype.remove = function() {
};

/* == DATAMARTS SECTION == */
DataWarehouse.prototype.createDatamart = function() {
};

DataWarehouse.prototype.getDatamart = function() {
};

DataWarehouse.prototype.listDatamarts = function() {
};

/* == DIMENSIONS SECTION == */
DataWarehouse.prototype.createDimension = function() {
};

DataWarehouse.prototype.getDimension = function() {
};

DataWarehouse.prototype.listDimensions = function() {
};

/* == CUBES SECTION == */
DataWarehouse.prototype.createCube = function() {
};

DataWarehouse.prototype.getCube = function() {
};

DataWarehouse.prototype.listCubes = function() {
};


module.exports = DataWarehouse;