const Contact = require("../../models/Contact.model");
const csv = require('csv-parser');
const fs = require('fs');
const { turnstileSchema } = require("librechat-data-provider");

const allContact = async(req,res) => {
    try {
        
        const contact = await Contact.find().sort({created_at : -1});
        res.json(contact);
    } catch (error) {
        res.status(500).json({
            success : false,
            message : "Something went wrong in allcontact",
            error : error.message
        })
    }

}

const setContact = async(req,res) => {
    try {
        
        console.log("req  ",req.body);
        const{name, company, role, email, notes, metaData } = req.body;

    if (!name) return res.status(400).json({
      success: false,
      message: "Name is required"
    });

    let metadataText = '';
    if (metaData && Object.keys(metaData).length > 0) {
      metadataText = Object.entries(metaData)
        .map(([k, v]) => `${k} ${v}`)
        .join(' ');
    }

    const contact = await Contact.create({
      name,
      company,
      role,
      email,
      notes,
      metaData,     
      metadataText   
    });

    res.status(200).json({
      success: true,
      message: "Contact added successfully",
      data: contact
    });

    } catch (error) {
        res.status(500).json({
            success : false,
            message : "something went wrong in setContact",
            error : error.message
        })
    }
}


const importFile =  async (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      const { name, company, role, email, notes, ...rest } = row;
      
      const metadataText = Object.entries(rest)
      .map(([k, v]) => `${k} ${v}`)
      .join(' ');

      results.push({ name, company, role, email, notes, metaData: rest, metadataText });
    })
    .on('end', async () => {
      await Contact.insertMany(results, { ordered: false });
      fs.unlinkSync(req.file.path);
      res.json({ message: `${results.length} contacts imported` });
    });
}

const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, role, email, notes, metaData } = req.body;

   if(!id)
   {
    return res.status(400).json({
      success : false,
      message : "Invalid contact"
    })
   }
    let metadataText = '';
    if (metaData && Object.keys(metaData).length > 0) {
      metadataText = Object.entries(metaData)
        .map(([k, v]) => `${k} ${v}`)
        .join(' ');
    }

    const updated = await Contact.findByIdAndUpdate(
      id,
      { name, company, role, email, notes, metaData, metadataText },
      { new: true }
    );

    if (!updated) 
    return res.status(404).json(
    { 
    success: false,
    message: 'Contact not found'
    });

    res.status(200).json({
      success : true,
      message : "Contact updated successfully",
      data : updated
    })
  } catch (error) {
    res.status(500).json({
      success : false,
      message : "something went wrong in updateContact",
      error : error.message
    })
  }
}

const deleteContact = async (req, res) => {
  try {
      const{ id } = req.params;
      if(!id)
      {
        return res.status(400).json({
          success : false,
          message : "No contact found",
        })
      }

      await Contact.findByIdAndDelete(
        id
      );

      res.status(200).json({
        success : true,
        message : "Contact deleted successfully",
      })
  } catch (error) {
     res.status(500).json({
      success : false,
      message : "something went wrong in deleteContact",
      error : error.message
    })
  }
}

module.exports = {allContact,setContact,importFile, updateContact, deleteContact};