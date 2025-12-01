import React from "react";
import { MapPin, Phone, Mail,Search  } from "lucide-react";

const Employees = () => {
  return (
    <>
      <div className="flex justify-around items-start mb-4 gap-5 mt-5">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800 ">
            Employee Management
          </h1>
          <p className="text-gray-600 mb-6">
            Manage your team members and their information
          </p>
        </div>

        <div className="flex  items-end gap-2">
          <button className="px-8 py-2 rounded-md bg-blue-600 text-gray-700 flex items-center gap-1 shadow-sm">
            + Add Employee
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-4 ">
        <div className="card w-80 h-25">
          <div className="flex items-center">
            <div className="text-right">
              <p className="text-gray-700 text-left text-2xl mb-1 font-bold">
                {" "}
                24
              </p>
              <p className="font-semibold text-gray-800 text-left">
                Total Employees
              </p>
            </div>
          </div>
        </div>
        <div className="card w-80 h-25">
          <div className="flex items-center">
            <div className="text-right">
              <p className="text-left text-2xl mb-1 text-green-500 font-bold">
                {" "}
                22
              </p>
              <p className="font-semibold text-gray-800 text-left">active</p>
            </div>
          </div>
        </div>
        <div className="card w-80 h-25">
          <div className="flex items-center">
            <div className="text-right">
              <p className=" text-left text-2xl mb-1 text-amber-300 font-bold">
                {" "}
                1
              </p>
              <p className="font-semibold text-gray-800 text-left">Pending</p>
            </div>
          </div>
        </div>
        <div className="card w-80 h-25">
          <div className="flex items-center">
            <div className="text-right">
              <p className="text-gray-700 text-left text-2xl mb-1 font-bold">
                {" "}
                1
              </p>
              <p className="font-semibold text-gray-800 text-left">inactive</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 min-h-screen">
        <div className=" mx-auto bg-white rounded-xl shadow-sm p-6 ">
          {/* Title + Search */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Employee List
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border-gray-300 border rounded-lg px-3 py-2 w-64">
                <Search className="w-4"/>
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="ml-2 outline-none text-sm w-full"
                />
              </div>


              <button className="border-gray-300 border  rounded-lg px-3 py-2 text-sm">
                All...
              </button>
            </div>
          </div>

          {/* Table */}
          <table className="w-full ">
            <thead className="">
              <tr className="text-left text-sm">
                <th className="pb-3">Name</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Contact</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Hours This Week</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="text-gray-800 ">
              {/* Row 1 */}
              <tr className="hover:bg-gray-50 border-b border-gray-300">
                <td className="py-4">
                  <p className="font-semibold">Sarah Johnson</p>
                  <div className="flex gap-1">
                    <MapPin className="w-3" />
                    <p className="text-sm text-gray-500">Downtown</p>
                  </div>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
                    Manager
                  </span>
                </td>

                <td>
                  <p className="flex items-center gap-1 text-sm">
                    <Mail className="w-4" />
                    sarah.johnson@company.com
                  </p>
                  <p className="flex items-center gap-1 text-sm">
                    <Phone className="w-4" />
                    555 123-4567
                  </p>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                </td>

                <td>
                  <p className="font-semibold">40h</p>
                  <p className="text-sm text-gray-500">Full-time</p>
                </td>

                <td className="text-right text-1xl font-bold">...</td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-gray-50 border-b border-gray-300">
                <td className="py-4">
                  <p className="font-semibold">Mike Davis</p>
                  <div className="flex gap-1">
                    <MapPin className="w-3" />
                    <p className="text-sm text-gray-500">Downtown</p>
                  </div>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
                    Server
                  </span>
                </td>

                <td>
                  <p className="flex items-center gap-1 text-sm">
                    <Mail className="w-4" />
                    sarah.johnson@company.com
                  </p>
                  <p className="flex items-center gap-1 text-sm">
                    <Phone className="w-4" />
                    555 123-4567
                  </p>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                </td>

                <td>
                  <p className="font-semibold">32h</p>
                  <p className="text-sm text-gray-500">Part-time</p>
                </td>

                <td className="text-right text-1xl font-bold">...</td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-gray-50 border-b border-gray-300">
                <td className="py-4">
                  <p className="font-semibold">Emily Chen</p>
                  <div className="flex gap-1">
                    <MapPin className="w-3" />
                    <p className="text-sm text-gray-500">Mall</p>
                  </div>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
                    Cashier
                  </span>
                </td>

                <td>
                  <p className="flex items-center gap-1 text-sm">
                    <Mail className="w-4" />
                    sarah.johnson@company.com
                  </p>
                  <p className="flex items-center gap-1 text-sm">
                    <Phone className="w-4" />
                    555 123-4567
                  </p>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                </td>

                <td>
                  <p className="font-semibold">28h</p>
                  <p className="text-sm text-gray-500">Part-time</p>
                </td>

           <td className="text-right text-1xl font-bold">...</td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-gray-50 border-b border-gray-300">
                <td className="py-4">
                  <p className="font-semibold">Alex Thompson</p>
                  <div className="flex gap-1">
                    <MapPin className="w-3" />
                    <p className="text-sm text-gray-500">Downtown</p>
                  </div>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
                    Kitchen Staff
                  </span>
                </td>

                <td>
                  <p className="flex items-center gap-1 text-sm">
                    <Mail className="w-4" />
                    sarah.johnson@company.com
                  </p>
                  <p className="flex items-center gap-1 text-sm">
                    <Phone className="w-4" />
                    555 123-4567
                  </p>
                </td>

                <td>
                  <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-full">
                    Pending
                  </span>
                </td>

                <td>
                  <p className="font-semibold">0h</p>
                  <p className="text-sm text-gray-500">Part-time</p>
                </td>

          <td className="text-right text-1xl font-bold">...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Employees;
