---
title: Git, GitHub, and Netlify
description: Learn the basics of git, GitHub and Netlify.
template: _base.html
---

# Git, GitHub, and Netlify

Welcome to the first post in the series!

Before we we dive into Git, Github and Netlify, let’s get some prerequisites out of the way.

## Git

### macOS

While macOS does come with Git preinstalled, the version of Git is more often than not out of date and, is easier to manage using Homebew. To start therefore, you will need to first install [Homebrew](https://brew.sh/). Once you have Homebrew installed, run the following command:

```
brew install git
```

> NOTE: After installing Git, run the following command:
>
> ```bash
> git --version
> ```
>
> If this outputs something like the following: `git version 1.7.10.2 (Apple Git-33)`, you need to correctly map
> the version of Git installed with Homebrew. See the link below for details.
> https://apple.stackexchange.com/questions/93002/how-to-use-the-homebrew-installed-git-on-mac

### Linux

Run `apt-get update && apt-get upgrade` to get the latest update packages and install them. This is to ensure that you are running the latest version of Git.

### Windows

You have a bit more work to do. The first step is to set up Windows Subsystem for Linux(WSL). Follow the instruction at the following URL:

- https://docs.microsoft.com/en-us/windows/wsl/install-win10

Once you have the above up and running, run the following command in the WSL shell:

```
`apt-get update && apt-get upgrade`
```

This is to ensure that you are running the latest version of Git.

## Visual Studio Code

The next piece of software to install is Visual Studio Code. For all operating systems, you can find the download link here:

- https://code.visualstudio.com/Download

> NOTE: On Windows and Linux systems the commond line utility for VSCode is automatically installed. If you are on macOS you will need to manually install the utility by following these steps: https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line

## GitHub and Netlify

Next we need to create a couple of accounts on GitHub and Netlify. To sign up for a GitHub account, go to the following URL:

- https://github.com/signup

Ensure that you complete the entire sign up process which will also require you to verify your email address. This is going to be important for some of the next steps in this series. Once complete, we can move onto Netlify.

- https://app.netlify.com/signup

You have a couple of options here, but because we will be using GitHub and Netlify so closely, the best option here is to simply sign in using your Github account. Once you have completed the sign up process, we are ready to get going.

## Source control

When working as a team, it is important to be able to share code between the team members. This is where source control comes in. With that said, even when you are the only developer, you will still need to use source control. The reason are three-fold:

- You might want to allow contributions in future, and this way, you are already set up to do so.
- You have an backup of the code on your machine so, there is no need to worry about losing it.
- A source control system creates a history of your code. This is useful for future reference, if something goes wrong, or you need to step back to an easrlier stage of development.

While there are many [source control systems](https://en.wikipedia.org/wiki/Version_control) out there, we will be using Git as it is the most ubiquitous system currently in use. It is also the system that underlys GitHub and Netlify.

With this basic understanding of what source control is, and why we will be using it, we can now move on to the next step.

## Configure Git for GitHub

In order to identify yourself with GitHub we are going to set up a user name and email address. This is required for us to be able to push code to GitHub. Open up the terminal(On Windows you will run this inside WSL) and run the following command:

```bash
git config --global user.name "Name Surname"
git config --global user.email "verified@email.com"
```

> NOTE: Ensure that you use your primary, verified email address here. You can double check this by going to your [GitHub settings](https://github.com/settings/emails)

## Create a new repository on GitHub

Next, we need to create a repository on GitHub. This is where we will store our code. Go to the following URL:

- https://github.com/new

In the "Repository name" field, enter the name of your project. For our purposes we will call this `intro-to-webdev`. Enter a short description for the repository, and leave it as public. Under "Initialize this repository with", check the box to "Add a README". We will also add a `.gitignore` file to ignore certain files. Once you check this second box, you will have the option to choose a template from the drop down. For our needs, we will choose "Node" from the available options. Lastly, we check the "Choose a license" box and select "MIT".

![Screen shot of the create repository form on Github](/assets/media/git-github-netlify/new-repository.png)

We are now ready to create our repository. Click the "Create repository" button.

Before we move on, let’s take a moment to review what we have created so far.

### README

The README file that GitHub created for us is a simple text file. It contains the name and the short description of the project by default. You can use this file to provide further instructions to the users or contributors of your project.

### `.gitignore`

Be default, Git will offer the manage _all_ the files that are inside our project. This is not always what we want. For example, we may want to ignore certain files that does not need to be in source control or, that contain secrets we do not want to make public. This is where the `.gitignore` file comes in. Whenever there is a file or directory you do not want Git to manage, add it to the `.gitignore` file.

### License

There are many, many licenses you can choose from when creating a project. For our purposes, we will be using the MIT license. This is a very simple license that is very widely used. If you want to learn more about the various open source licenses, you can find them here:

- https://choosealicense.com/

What is a repository you might be asking? A repository is a collection of files and directories much like those you have already interacted with on your computer. The main differences are that when you create a repository, you are creating a collection of files and directories that are managed by Git. Most importantly, Git creates and manages what is knows as a [commit history](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History). This is a list of every file that has been changed in the repository along with a commit message that you specify when creating the commit.

At any time, you can go back to any commit in the commit history and see exactly what changes have been made to the repository, and potentially by who.

## Clone the repository

At this point though, the repository is not yet on your computer. To get it onto your computer, we will need to clone it. Cloning creates a copy of the repository on your coputer. This will also include the Git history. To clone the repository we just created, go to your terminal and run the following commands:

```bash
mkdir dev # Creates a directory called dev
cd dev # Changes directory to the dev directory
# Clone the repository. To get the URL, go to your repository on https://github.com,
# click the "Code" button, and copy the URL under the HTTPS clone URL. For example:
git clone https://github.com/yourusername/intro-to-webdev.git
```

Once you press enter, you may be prompted to enter your GitHub password. This is because Git needs to access your account to download the repository. This is a one time operation as your password will be remembered in your operating systems keychain for future use. Once the command completes, you will be able to change into the new directory:

```bash
cd intro-to-webdev
```

If you now run the following command:

```bash
ls -l
```

You will see a listing of the directory contents which will include the README, the LICENSE, and the `.gitignore` file.

> NOTE: Depending on your system settings, the `.gitignore` file may be hidden.

Next, type the following command:

```bash
git remote -v
```

The output of this will be something like the following:

```
origin	https://github.com/yourusername/intro-to-webdev.git (fetch)
origin	https://github.com/yourusername/intro-to-webdev.git (push)
```

The above shows that our local clone of the repository is connected to our remote repository on GitHub. It also indicates that we can both `fetch` and `push` to the remote repository. More on this shortly.

## Connect our repository to Netlify

While we can run and test our website on our local machine, I prefer to also get the website onto a server. This allows you to easily show others what you are learning, ask for help, and learn a common process you will use going forward. To do this, we will need to connect our repository to Netlify.

While [logged into Netlify](https://app.netlify.com/teams/schalkneethling/overview), you should see a "New site from Git" button. Click the button to get started.

![Screen shot of the Netlify dashboard showing the New site from Github button](/assets/media/git-github-netlify/new-site-from-git.png)

On the next screen, click the GitHub button.

![Screen shot of the new site screen showing the Github button among other options](/assets/media/git-github-netlify/ci-github.png)

This will open a new window where you will need to authorize Netlify to have access to your public repositories on GitHub. Once you have authorized Netlify, you will be presented with a list of repositories. Select the repository you just created.

The next screen will ask you for a number of details related to how you want to host your site. You can leave the defaults for owner and branch as well as the defaults for the basic build settings. Right now, our website does not make use of any build steps, and we will simply ask Netlify to serve the website from our project root folder.

If you leave the default empty field for the base directory, this is exactly what Netlify will do. In future, you might be using some tooling to build your site. In those cases, you will specify the command to run in the `build command` field. Often times, the build tool will output the files into a different directory than the project root. In those cases, you will need to specify the publish directory.

For now though, the defaults will be fine. Click the "Deploy site" button.

At the top of the next page you will see a lot of details about the site. Among this information will be an auto generated URL that will look something like this: https://determined-lalande-369a63.netlify.app/

![Screen shot of the site overview showing the website URL](/assets/media/git-github-netlify/netlify-website-url.png)

Below this you will also see any deployments that has happened. You should see one deployment at the moment. Clicking on the URL will result in a page opening in a new tab. However, at this point it will show a 404 error page. Let’s fix this.

> NOTE: By default Netlify will automatically deploy the site whenever there is a push or merge to the main branch. More on this later.

## Git/GitHub workflow

Git, uses the concept of branches to manage how you work. When you initially created and cloned your repository, Git setup a branch called `main`. This will be where code lives that has been thouroughly tested, reviewed, and either deployed to production or available for you users to download. When you want to make a change to your code, you will create a new branch. This new branch will be based off of the main branch i.e. it will create a copy of the state of the main branch. This means that any changes made in this new branch will not affect the `main` branch until we decide to merge the changes into the main branch.

> NOTE: We won’t dig to deep into branches and Git in this course but if you are curious, the Git documentation is
> a great place to read more. https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging

These branches are commonly referred to as feature branches. We are going to add an `index.html` file to the root of our project and so, we will need to create a feature branch to work on. To do this, we will use the following command:

```bash
git switch -c add-index
```

> NOTE: If Git does not recognize the command, you can use the following command instead:
>
> ```bash
> git checkout -b add-index
> # The above is a short form of the following commands:
> # git branch add-index
> # git checkout add-index
> ```

## Open the project in VSCode

From the root of your project directory, run the following command:

```bash
code .
```

This tells VSCode to open the project in the current directory. If you are using VSCode, you will see a new window open with the project. If you did not before, you will now see the `.gitignore` file listed in the project explorer.

## Create the `index.html` file

Right click on an empty space in the project explorer and select "New File". Call this file `index.html`. Because VSCode now knows that the new file is an HTML file, it will provide you with some useful snippets. In the new file, type the following:

```html
html
```

From the options that show up, choose `html:5` and press the tab key. This will insert the following code:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body></body>
</html>
```

Go ahead and change the text between the `title` tag to "Introduction to Web Development".

```html
<title>Introduction to Web Development</title>
```

This is the text that will be displayed in the browser tab when the page is loaded.
To the `body` of the HTML document add the following:

```html
<h1>It Works!</h1>
```

## Add and commit

At the moment, Git is aware that a new file has been added to the project but, it is not yet under version control. Run the following command to see the current status of the branch:

```bash
git status
```

This should output something like the following:

```bash
On branch add-index
Your branch is ahead of 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        index.html

nothing added to commit but untracked files present (use "git add" to track)
```

To add the file to version control, we will use the following command:

```bash
git add .
```

The `.` above tells Git to add this new file to version control. If you made changes to any files that are already under version control, these will be added as well(so be careful you are not adding anything you do not want tracked by Git). Run `git status` again. The output has now changed to something like the following:

```bash
On branch add-index
Your branch is ahead of 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   index.html
```

## Push the changes to GitHub

We are now ready to push our changes to GitHub. Run the following command:

```bash
git push origin add-index
```

Let’s take a moment to understand what is going on here.

### `git push`

This command tells Git to send the changes in the current branch to... somewhere :) In our case, it is the remote repository that is hosted on GitHub.

### `git push origin`

Earlier when we ran the command `git remote -v` we got the following output:

```bash
origin	https://github.com/yourusername/intro-to-webdev.git (fetch)
origin	https://github.com/yourusername/intro-to-webdev.git (push)
```

The `origin` part of this is the name of the remote repository Git is tracking.

### `git push origin add-index`

The last part of the command tells Git the branch you want to push to the remote.

## Pull request time!

Open up the repository on GitHub. For example: https://github.com/schalkneethling/intro-to-webdev.
You should see a banner at the top of the page with a button that says "Compare & pull request".

![Screen shot of the compare & pull request banner](/assets/media/git-github-netlify/compare-and-pull.png)

Click the "Compare & pull request" button. On the next page you will be presented with a form that looks like the following:

![Screen shot of the pull request form page](/assets/media/git-github-netlify/open-pull-request.png)

This is where you will provide information about the intended changes and request review from a coworker. For now, this is an opportunity to use and explore the GitHub pull request feature, as well as an opportunity to double check your own work. Feel free to enter some information or, simply go ahead and click the "Create pull request" button.

The next page shows you open pull request.

![Screen shot of the pull request page](/assets/media/git-github-netlify/pull-request.png)

You will notice that there is a link at the top that reads, "Files changed". Click this link and you will be taken to a page that shows you the diffs between the current branch and the branch you are pushing to i.e. the changes you are proposing.

Click on the link that reads, "Conversation". At the bottom you will see a button that reads, "Merge pull request". Click this button and then click the button that reads, "Confirm merge". We are now merging the code from our `add-index` branch into our `main` branch.

> NOTE: If you are presented with a button that reads, "Delete branch", click that button. As our changes have now been merged into `main` we no longer need to keep this branch around.

## Syncing your local repository with the remote repository

While our changes have been merged into `main`, we still need to sync our local repository with the remote repository. Currently, we are still on the `add-index` branch so, the first thing to do is switch to `main`:

```bash
git switch main
```

> NOTE: Again, if you needed to run `git checkout` previous instead of `git switch`, you would use `git checkout main` here.

As we had done on GitHub, we can now delete our feature branch locally:

```bash
git branch -D add-index
```

Now we can pull down our changes from GitHub. To do this, run the following command:

```bash
git pull origin main
```

As you will see, this command is a _lot_ like the `push` command we ran earlier. The only difference is that it is pulling down the changes from the remote repository instead of pushing it up to the remote. You should see the following output:

```bash
remote: Enumerating objects: 1, done.
remote: Counting objects: 100% (1/1), done.
remote: Total 1 (delta 0), reused 0 (delta 0), pack-reused 0
Unpacking objects: 100% (1/1), 623 bytes | 623.00 KiB/s, done.
From https://github.com/schalkneethling/intro-to-webdev
 * branch            master     -> FETCH_HEAD
   81df97a..8275346  master     -> origin/master
Updating 81df97a..8275346
Fast-forward
 index.html | 15 +++++++++++++++
 1 file changed, 15 insertions(+)
 create mode 100644 index.html
```

As you can see from the above, it pulled down our new `index.html` file.

## Seeing our index page on Netlify

When we merged our branch into `main`, Netlify automatically built and deployed our site. To see this, head over to Netlify and click on the link that previously returned a 404 error. You should now see a page load with the title you set and the text "It Works!".

## Homework

To practice what we have done here, do the following:

- Create a new feature branch.
- You will be adding a [list](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ul) of the topics we learned today to your `index.html` file so, keep that in mind when naming your branch.
- Make your changes.
- Push your changes to GitHub.
- Open a pull request and merge if you are happy with the work.
- Make sure that you clean up and sync your local repository with the remote repository.
- Send me the link to your page on Netlify with the list as well as your repository.
