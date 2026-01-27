import mongoose from 'mongoose';

const carGroupsSchema = new mongoose.Schema({
  groups: [
    {
      group: {
        type: String,
        required: true,
        unique: true
      },
      brands: [
        {
          name: {
            type: String,
            required: true
          },
          models: {
            type: [String],
            required: true
          },
          materials: {
            type: [String],
            required: true
        }}
      ]
    }
  ]
}, { timestamps: true });

export default mongoose.model('CarGroup', carGroupsSchema);