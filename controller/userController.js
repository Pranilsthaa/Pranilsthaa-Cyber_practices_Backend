const {runQuery} = require('../connection');

const fetchUserPermissions = async roleId => {
  if (!roleId) {
    throw new Error('Role ID is required to fetch permissions.');
  }
  return await runQuery(
    ` SELECT 
        up.id,
        up.permission
        FROM user_permission up
        INNER JOIN role_permission rp 
        ON up.id = rp.permission_id
        WHERE rp.role_id = ?;`,
    [roleId],
  );
};

const getUserPermission = async (req, res) => {
  try {
    const user_permissions = await fetchUserPermissions(req.user.role);
    if (user_permissions.length > 0) {
      res.status(200).send({
        user_permissions,
        roleId: req.user.role,
      });
    } else {
      res.status(204).send({message: 'No permissions found for this user.'});
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }
};

const dummyEmployee = [
  {
    id: 1,
    name: 'John Doe',
    position: 'Software Engineer',
    department: 'Engineering',
  },
  {
    id: 2,
    name: 'Jane Smith',
    position: 'Product Manager',
    department: 'Product',
  },
  {
    id: 3,
    name: 'Alice Johnson',
    position: 'UX Designer',
    department: 'Design',
  },
  {
    id: 4,
    name: 'Bob Brown',
    position: 'Data Scientist',
    department: 'Data Science',
  },
  {
    id: 5,
    name: 'Charlie White',
    position: 'DevOps Engineer',
    department: 'Operations',
  },
];

const getEmployee = async (req, res) => {
  res.status(200).send(dummyEmployee);
};

module.exports = {
  fetchUserPermissions,
  getUserPermission,
  getEmployee,
};
