//models/Task.js
import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    deadline: { type: Date, required: true },
    duration: { type: Number, required: true },
    isProject: { type: Boolean, default: false },
    priority: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    timer: { type: Number, default: 0 }, 
    progress: [{ day: { type: Date }, hours: { type: Number, default: 0 } }],
    notes: [
      {
        header: { type: String, required: true },
        comments: [
          {
            text: { type: String, required: true },
            attachments: [String],
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Task', TaskSchema);
