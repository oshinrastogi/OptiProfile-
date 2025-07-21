// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/auth';

const AdminDashboard = () => {
    const [auth] = useAuth();
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [skillSearchQuery, setSkillSearchQuery] = useState(''); 
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const BACKEND_URL = import.meta.env.VITE_BACKEND_API;

    useEffect(() => {
        if (!auth?.user || auth.user.role !== 1) {
            toast.error("Unauthorized access. You must be an admin.Login as admin. Redirecting...");
            // Optionally redirect to login or home page
            navigate('/login');
        }
    }, [auth]);

    // Fetch job categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get(`${BACKEND_URL}/api/v1/admin/job-categories`, { withCredentials: true });
                if (data.success) {
                    setCategories(['All', ...data.categories]);
                } else {
                    setError(data.message || 'Failed to fetch categories.');
                    toast.error(data.message || 'Failed to fetch categories.');
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to fetch job categories.');
                toast.error('Failed to fetch job categories.');
            }
        };
        if (auth?.user?.role === 1) {
            fetchCategories();
        }
    }, [auth, BACKEND_URL]);

    // Fetch candidates based on selected category AND skill search
    useEffect(() => {
        const fetchCandidates = async () => {
            setLoading(true);
            setError('');
            try {
                let url = `${BACKEND_URL}/api/v1/admin/candidates`; // Default URL for category filter

                const params = { category: selectedCategory };

                if (skillSearchQuery.trim()) {
                    // If skill search is active, use the new skill search endpoint
                    url = `${BACKEND_URL}/api/v1/admin/search-candidates-by-skill`;
                    params.skill = skillSearchQuery.trim();
                }

                const { data } = await axios.get(url, {
                    params: params, // Pass both category and skill if present
                    withCredentials: true
                });

                if (data.success) {
                    setCandidates(data.candidates);
                } else {
                    setError(data.message || 'Failed to fetch candidates.');
                    toast.error(data.message || 'Failed to fetch candidates.');
                }
            } catch (err) {
                console.error('Error fetching candidates:', err);
                const errorMessage = err.response?.data?.message || 'Failed to fetch candidates.';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        if (auth?.user?.role === 1) {
            fetchCandidates();
        }
    }, [ skillSearchQuery, auth, BACKEND_URL]); // Re-fetch when category or skill search changes

    if (!auth?.user || auth.user.role !== 1) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <h1 className="text-2xl text-red-600">Access Denied: You are not an administrator.</h1>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
                <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
                    Admin <span className="text-blue-600">Dashboard</span>
                </h1>

                {error && <p className="text-red-600 text-center mb-4">{error}</p>}

                {/* Category Filter */}
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Filter by Job Category:</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setSkillSearchQuery(''); // Clear skill search when category changes
                                }}
                                className={`px-5 py-2 rounded-full font-medium transition-all duration-200
                                    ${selectedCategory === cat && !skillSearchQuery
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skill Search Input */}
                <div className="mb-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Search by Skill:</h3>
                    <input
                        type="text"
                        value={skillSearchQuery}
                        onChange={(e) => {
                            setSkillSearchQuery(e.target.value);
                            setSelectedCategory('All'); // Reset category filter when skill search is active
                        }}
                        placeholder="e.g., React, Node.js, MongoDB"
                        className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                </div>


                {/* Candidates List */}
                <div className="bg-white shadow-lg rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        Candidates: <span className="text-blue-600">
                            {skillSearchQuery ? `with "${skillSearchQuery}"` : selectedCategory}
                        </span>
                    </h3>

                    {loading ? (
                        <p className="text-center text-blue-600 text-lg">Loading candidates...</p>
                    ) : candidates.length === 0 ? (
                        <p className="text-center text-gray-600 text-lg">No candidates found matching your criteria.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Job Title
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ATS Score
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Eligibility
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Analyzed At
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Skills
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {candidates.map((candidate) => (
                                        <tr key={candidate._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {candidate.userEmail}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {candidate.jobTitle}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {candidate.ats_score}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {candidate.is_eligible}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(candidate.analyzedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis">
                                                {candidate.resumeSkills && candidate.resumeSkills.length > 0
                                                    ? candidate.resumeSkills.join(', ')
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2">
                                                <a href={`mailto:${candidate.userEmail}`} className="text-blue-600 hover:text-blue-900">
                                                    Reach Out
                                                </a>
                                                {candidate.pdfPath && (
                                                    <a
                                                        href={`${BACKEND_URL}/${candidate.pdfPath}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-purple-600 hover:text-purple-900 ml-2"
                                                    >
                                                        View PDF
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminDashboard;