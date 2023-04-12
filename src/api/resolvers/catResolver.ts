import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {User, UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
export default {
  Query: {
    cats: async () => {
      return await catModel.find();
    },
    catById: async (_parent: undefined, args: Cat) => {
      return await catModel.findById(args.id);
    },
    catsByOwner:async (_parent: undefined, args: User) => {
      return await catModel.find({
        owner: args.id
      }).select('owner')
    },
    catsByArea: async (_parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },
  Mutation: {
    createCat: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      args.owner = user.id as unknown as Types.ObjectId;
      const cat = new catModel(args);
      return await cat.save();
    },
    updateCat:async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      const cat = await catModel.findById(args.id)
      if (!user.token || cat?.owner.toJSON().toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
    },
    updateCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      console.log(user.role)
      //const cat = await catModel.findById(args.id)
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      });
    },
    deleteCat: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      const cat = await catModel.findById(args.id)
      if (!user.token || cat?.owner.toJSON().toString() !== user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
    deleteCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      //const cat = await catModel.findById(args.id)
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
  },
}