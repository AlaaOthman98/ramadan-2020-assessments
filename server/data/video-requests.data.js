const VideoRequest = require("./../models/video-requests.model");
const User = require("./../models/user.model");

module.exports = {
  createRequest: async (vidRequestData) => {
    const authorId = vidRequestData.author_id;

    if (authorId) {
      const userObj = await User.findOne({ _id: authorId });
      vidRequestData.author_name = userObj.author_name;
      vidRequestData.author_email = userObj.author_email;
    }

    let newRequest = new VideoRequest(vidRequestData);
    return newRequest.save();
  },

  getAllVideoRequests: (top) => {
    return VideoRequest.find({}).sort({ submit_date: "-1" }).limit(top);
  },

  searchRequests: (topic) => {
    return VideoRequest.find({ topic_title: { $regex: topic, $options: "i" } }).sort({ submit_date: "-1" });
  },

  getRequestById: (id) => {
    return VideoRequest.findById({ _id: id });
  },

  updateRequest: (id, status, resVideo) => {
    const updates = {
      status: status,
      video_ref: {
        link: resVideo,
        date: resVideo && new Date(),
      },
    };

    return VideoRequest.findByIdAndUpdate(id, updates, { new: true });
  },

  updateVoteForRequest: async (id, vote_type, user_id) => {
    const oldRequest = await VideoRequest.findById({ _id: id });
    const other_vote_type = vote_type === "ups" ? "downs" : "ups";

    const oldVoteList = oldRequest.votes[vote_type];
    const oldOtherVoteList = oldRequest.votes[other_vote_type];

    if (!oldVoteList.includes(user_id)) {
      oldVoteList.push(user_id);
    } else {
      oldVoteList.splice(oldVoteList.indexOf(user_id), 1);
    }

    if (oldOtherVoteList.includes(user_id)) {
      oldOtherVoteList.splice(oldOtherVoteList.indexOf(user_id), 1);
    }

    return VideoRequest.findByIdAndUpdate(
      { _id: id },
      {
        votes: {
          [vote_type]: oldVoteList,
          [other_vote_type]: oldOtherVoteList,
        },
      },
      { new: true }
    );
  },

  deleteRequest: (id) => {
    return VideoRequest.deleteOne({ _id: id });
  },
};

