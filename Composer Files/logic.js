/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */

/**
 * Sample transaction processor function.
 * @param {org.example.mynetwork.Supply} tx The transaction instance.
 * @transaction
 */

 async function shipping(tx) {
     // Save the old value of the asset.
    const oldOwnerId = tx.batch.ownerId;

    // Update the asset with the new value.
    tx.batch.ownerId = tx.newOwner.id;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.example.mynetwork.Package');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.batch);        

    const contract = getFactory().newResource('org.example.mynetwork', 'makeContract', 'CON_001');
    contract.manufacturer = getFactory().newRelationship('org.example.mynetwork', 'Manufacturer', '');
    contract.shipper = getFactory().newRelationship('org.example.mynetwork', 'Shipper', '');
    contract.wholesaleperson = getFactory().newRelationship('org.example.mynetwork', 'Wholesaleperson', '');
    contract.retailer = getFactory().newRelationship('org.example.mynetwork', 'Retailer', '');
    contract.box = getFactory().newRelationship('org.example.mynetwork', 'Package', '');
    const today = shipping.timestamp;
    contract.startDateTime = today; // the contract created at this time
    contract.status =  'SHIPPED' //giving status of shipment

    const contractRegistry = await getAssetRegistry('org.example.mynetwork.makeContract');
    await contractRegistry.addAll([contract]);

    // Emit an event for changing ownership
    let event = getFactory().newEvent('org.example.mynetwork', 'changeOwner');
    event.batch = tx.batch;
    event.oldOwner = oldOwnerId;
    event.newOwner = tx.newOwner.id;
    emit(event);
}

/**
 * Giving ownership to wholesaleperson
 * @param {org.example.mynetwork.Wholesale} wtx The transaction instance.
 * @transaction
 */

async function wholesale(wtx) {
    // Save the old value of the asset.
   const oldOwnerId = wtx.batch.ownerId;

   // Update the asset with the new value.
   wtx.batch.ownerId = wtx.newOwner.id;

   const contract = wtx.start;
   contract.status = 'WHOLESALE';

   // Get the asset registry for the asset.
   const assetRegistry = await getAssetRegistry('org.example.mynetwork.Package');
   // Update the asset in the asset registry.
   await assetRegistry.update(wtx.batch); 

   const contractRegistry = await getAssetRegistry('org.example.mynetwork.makeContract');
   await contractRegistry.update(wtx.start);

   // Emit an event for changing ownership
   let event = getFactory().newEvent('org.example.mynetwork', 'changeOwner');
   event.batch = wtx.batch;
   event.oldOwner = oldOwnerId;
   event.newOwner = wtx.newOwner.id;
   emit(event);
}

/**
 * Giving ownership to retailer and ending contract
 * @param {org.example.mynetwork.Retail} rtx The transaction instance
 * @transaction 
 */

 async function retail(rtx) {
   // Save the old value of the asset.
   const oldOwnerId = rtx.batch.ownerId;

   // Update the asset with the new value.
   rtx.batch.ownerId = rtx.newOwner.id;
 
   const contract = rtx.start;
   contract.status = 'RETAIL';

   const assetRegistry = await getAssetRegistry('org.example.mynetwork.Package');
   // Update the asset in the asset registry.
   await assetRegistry.update(rtx.batch); 

   const contractRegistry = await getAssetRegistry('org.example.mynetwork.makeContract');
   await contractRegistry.update(rtx.start);

   const econtract = getFactory().newResource('org.example.mynetwork', 'endContract', 'ECON_001');
    econtract.manufacturer = getFactory().newRelationship('org.example.mynetwork', 'Manufacturer', '');
    econtract.shipper = getFactory().newRelationship('org.example.mynetwork', 'Shipper', '');
    econtract.wholesaleperson = getFactory().newRelationship('org.example.mynetwork', 'Wholesaleperson', '');
    econtract.retailer = getFactory().newRelationship('org.example.mynetwork', 'Retailer', '');
    econtract.box = getFactory().newRelationship('org.example.mynetwork', 'Package', '');
    econtract.initContract = getFactory().newRelationship('org.example.mynetwork', 'makeContract', 'CON_001');
    const today = retail.timestamp;
    econtract.endTime = today; // the contract created at this time
    econtract.status =  'RETAIL' //giving status of shipment

   const econtractRegistry = await getAssetRegistry('org.example.mynetwork.endContract');
   await econtractRegistry.addAll([econtract]);

   // Emit an event for changing ownership
   let event = getFactory().newEvent('org.example.mynetwork', 'changeOwner');
   event.batch = wtx.batch;
   event.oldOwner = oldOwnerId;
   event.newOwner = wtx.newOwner.id;
   emit(event);
}

/**
 * A temperature reading has been received for a shipment
 * @param {org.example.mynetwork.TemperatureReading} temperatureReading - the TemperatureReading transaction
 * @transaction
 */
async function temperatureReading(temperatureReading) {  // eslint-disable-line no-unused-vars

    const box = temperatureReading.package;

    console.log('Adding temperature ' + temperatureReading.mean + ' to shipment ' + box.$identifier);

    if (box.temperature_cur) {
        box.temperature_cur.push(temperatureReading);
    } else {
        box.temperature_cur = [temperatureReading];
    }

    // add the temp reading to the shipment
    const shipmentRegistry = await getAssetRegistry('org.example.mynetwork.Package');
    await shipmentRegistry.update(box);
}

/**
 * A geographic location has been received for a shipment
 * @param {org.example.mynetwork.LocationReading} locationReading - the LocationReading transaction
 * @transaction
 */
async function locationReading(locationReading) {  // eslint-disable-line no-unused-vars

    const box = locationReading.package;

    console.log('Adding location ' + locationReading.coordinate + ' to shipment ' + box.$identifier);

    if (box.location) {
        box.location.push(locationReading);
    } else {
        box.location = [locationReading];
    }

    // add the location reading to the shipment
    const shipmentRegistry = await getAssetRegistry('org.example.mynetwork.Package');
    await shipmentRegistry.update(box);
}

/**
 * Creating new package
 * @param {org.example.mynetwork.createPackage} cptx The transaction instance.
 * @transaction
 */

 async function CreatePackage(cptx) {
    const shipment = getFactory().newResource('org.example.mynetwork', 'Package', 'BAT_0001');
    shipment.shipmentId = '314f';
    shipment.expirydate = '';
    shipment.unitCount = 5000;
    shipment.meanTemperature = 5;
    shipment.ownerId = '1232';
    shipment.owner = getFactory().newRelationship('org.example.mynetwork', 'Manufacturer', 'M_0001');

    //adding the package
    const shipmentRegistry = await getAssetRegistry('org.example.mynetwork.Package');
    await shipmentRegistry.addAll([shipment]);
}

/**
 * Creating new manufacturer
 * @param {org.example.mynetwork.createManufacturer} cmtx The transaction instance
 * @transaction
 */

 async function CreateManufacturer (cmtx) {
     const manufacturer = getFactory().newResource('org.example.mynetwork', 'Manufacturer', 'MAN_0001');
     const manufacturerAddress = getFactory().newConcept('org.example.mynetwork','Address');
     manufacturer.firstName = 'ABC';
     manufacturer.lastName = 'DEF';
     manufacturerAddress.city = 'XYZ';
     manufacturerAddress.zip = '111111';
     manufacturerAddress.state = 'PQR';
     manufacturer.address = manufacturerAddress;

     //adding the manufacturer
     const manufacturerRegistry = await getParticipantRegistry('org.example.mynetwork.Manufacturer');
     await manufacturerRegistry.addAll([manufacturer]);
}

/**
 * Creating new shipper
 * @param {org.example.mynetwork.createShipper} cstx The transaction instance
 * @transaction
 */

async function CreateShipper (cstx) {
    const shipper = getFactory().newResource('org.example.mynetwork', 'Shipper', 'SH_0001');
    const shipperAddress = getFactory().newConcept('org.example.mynetwork', 'Address');
    shipper.firstName = 'AAA';
    shipper.lastName = 'BBB';
    shipperAddress.city = 'XXX';
    shipperAddress.zip = '000000';
    shipperAddress.state = 'PPP';
    shipper.address = shipperAddress;

    //adding the shipper
    const shipperRegistry = await getParticipantRegistry('org.example.mynetwork.Shipper');
    await shipperRegistry.addAll([shipper]);
}

/**
 * Creating new wholesaleperson
 * @param {org.example.mynetwork.createWholesaleperson} cwtx The transaction instance
 * @transaction
 */

async function CreateWholesaleperson (cwtx) {
    const wholesaleperson = getFactory().newResource('org.example.mynetwork', 'Wholesaleperson', 'W_0001');
    const wholesalepersonAddress = getFactory().newConcept('org.example.mynetwork', 'Address');
    wholesaleperson.firstName = 'CCC';
    wholesaleperson.lastName = 'DDD';
    wholesalepersonAddress.city = 'YYY';
    wholesalepersonAddress.zip = '222222';
    wholesalepersonAddress.state = 'QQQ';
    wholesaleperson.address = wholesalepersonAddress;

    //adding the wholesaleperson
    const wholesalepersonRegistry = await getParticipantRegistry('org.example.mynetwork.Wholesaleperson');
    await wholesalepersonRegistry.addAll([wholesaleperson]);
}

/**
 * Creating new retailer
 * @param {org.example.mynetwork.createRetailer} crtx The transaction instance
 * @transaction
 */

async function CreateRetailer (crtx) {
    const retailer = getFactory().newResource('org.example.mynetwork', 'Retailer', 'RE_0001');
    const retailerAddress = getFactory().newConcept('org.example.mynetwork', 'Address');
    retailer.firstName = 'EEE';
    retailer.lastName = 'FFF';
    retailerAddress.city = 'ZZZ';
    retailerAddress.zip = '333333';
    retailerAddress.state = 'RRR';
    retailer.address = retailerAddress

    //adding the retailer
    const retailerRegistry = await getParticipantRegistry('org.example.mynetwork.Retailer');
    await retailerRegistry.addAll([retailer]);
}
